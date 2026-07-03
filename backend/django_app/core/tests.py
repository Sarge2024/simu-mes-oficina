import json
import logging
from unittest.mock import patch, MagicMock
from django.test import TestCase, override_settings, RequestFactory
from django.contrib.auth.models import User
from django.db import connection
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from core.models import Cliente, Fornecedor, Colaborador, AuditLog, AuditLogAcao
from core.middleware import CurrentUserMiddleware, get_current_user, _thread_locals
from core.views import AuditLogViewSet
from veiculos.models import Ativo, Marca, Modelo, Versao


TEST_DB = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}


def clear_thread_local():
    if hasattr(_thread_locals, 'user'):
        delattr(_thread_locals, 'user')


@override_settings(DATABASES=TEST_DB)
class AuditLogModelTest(TestCase):
    """Testa o model AuditLog - choices, tipos de campo, índices."""

    def setUp(self):
        clear_thread_local()

    def test_audit_log_action_choices_exist(self):
        self.assertEqual(AuditLogAcao.CRIADO, 'Criado')
        self.assertEqual(AuditLogAcao.EDITADO, 'Editado')
        self.assertEqual(AuditLogAcao.EXCLUIDO, 'Excluído')
        self.assertEqual(AuditLogAcao.ROLLBACK, 'Rollback')

    def test_audit_log_str_representation(self):
        log = AuditLog(
            usuario='admin',
            tabela='core.Cliente',
            registro_id='1',
            acao=AuditLogAcao.CRIADO,
            detalhes={'nome': 'Teste'},
        )
        self.assertIn('admin', str(log))
        self.assertIn('Criado', str(log))
        self.assertIn('core.Cliente', str(log))

    def test_registro_id_accepts_string(self):
        log = AuditLog.objects.create(
            usuario='Sistema',
            tabela='test.Model',
            registro_id='uuid-abc-123',
            acao=AuditLogAcao.CRIADO,
            detalhes={},
        )
        self.assertEqual(log.registro_id, 'uuid-abc-123')

    def test_registro_id_accepts_integer_as_string(self):
        log = AuditLog.objects.create(
            usuario='Sistema',
            tabela='test.Model',
            registro_id='42',
            acao=AuditLogAcao.EDITADO,
            detalhes={},
        )
        self.assertEqual(log.registro_id, '42')

    def test_detalhamento_blank_allowed(self):
        log = AuditLog.objects.create(
            usuario='Sistema',
            tabela='test.Model',
            registro_id='1',
            acao=AuditLogAcao.CRIADO,
            detalhes={},
            detalhamento='',
        )
        self.assertEqual(log.detalhamento, '')


@override_settings(DATABASES=TEST_DB)
class AuditLogSignalTest(TestCase):
    """Testa os signals de auditoria - captura de create, update, delete e usuário real."""

    def setUp(self):
        clear_thread_local()
        self.cliente_data = {
            'nome_razao': 'Teste LTDA',
            'cpf_cnpj': '12345678000100',
        }

    def test_create_generates_audit_log(self):
        self.assertEqual(AuditLog.objects.count(), 0)
        Cliente.objects.create(**self.cliente_data)
        logs = AuditLog.objects.filter(tabela='core.Cliente', acao='Criado')
        self.assertEqual(logs.count(), 1)
        log = logs.first()
        self.assertEqual(log.usuario, 'Sistema')
        self.assertEqual(log.registro_id, str(Cliente.objects.first().pk))

    def test_update_generates_audit_log_with_diff(self):
        cliente = Cliente.objects.create(**self.cliente_data)
        self.assertEqual(AuditLog.objects.filter(acao='Criado').count(), 1)

        cliente.nome_razao = 'Teste Atualizado LTDA'
        cliente.save()

        edit_logs = AuditLog.objects.filter(tabela='core.Cliente', acao='Editado')
        self.assertEqual(edit_logs.count(), 1)
        log = edit_logs.first()
        self.assertIn('nome_razao', log.detalhamento)
        self.assertIn('➔', log.detalhamento)

    def test_delete_generates_audit_log(self):
        cliente = Cliente.objects.create(**self.cliente_data)
        pk = cliente.pk
        cliente.delete()

        delete_logs = AuditLog.objects.filter(tabela='core.Cliente', acao='Excluído')
        self.assertEqual(delete_logs.count(), 1)
        log = delete_logs.first()
        self.assertEqual(log.registro_id, str(pk))
        self.assertIn('removido', log.detalhamento.lower())

    def test_audit_log_captures_real_user(self):
        user = User.objects.create_user(username='joao', password='test123')

        mock_request = MagicMock()
        mock_request.user = user
        middleware = CurrentUserMiddleware(lambda r: MagicMock())
        middleware(mock_request)

        self.assertEqual(get_current_user(), user)

        cliente = Cliente.objects.create(**self.cliente_data)
        log = AuditLog.objects.filter(tabela='core.Cliente', acao='Criado').first()
        self.assertEqual(log.usuario, 'joao')

    def test_audit_log_defaults_to_sistema_when_no_user(self):
        clear_thread_local()
        self.assertIsNone(get_current_user())

        cliente = Cliente.objects.create(**self.cliente_data)
        log = AuditLog.objects.filter(tabela='core.Cliente', acao='Criado').first()
        self.assertEqual(log.usuario, 'Sistema')


@override_settings(DATABASES=TEST_DB)
class AuditLogAPIViewTest(APITestCase):
    """Testa as views e API endpoints do AuditLog."""

    def setUp(self):
        clear_thread_local()
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            username='admin', password='admin123', is_staff=True, is_superuser=True
        )
        self.regular_user = User.objects.create_user(
            username='user', password='user123'
        )
        self.cliente = Cliente.objects.create(
            nome_razao='Teste LTDA',
            cpf_cnpj='12345678000100',
        )
        self.cliente.nome_razao = 'Teste Atualizado LTDA'
        self.cliente.save()

    def test_unauthenticated_cannot_access_logs(self):
        response = self.client.get('/api/core/logs-auditoria/')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_regular_user_cannot_access_logs(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get('/api/core/logs-auditoria/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_access_logs(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/core/logs-auditoria/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertIn('count', response.data)

    def test_pagination_works(self):
        for i in range(10):
            Cliente.objects.create(nome_razao=f'Cliente {i}', cpf_cnpj=f'111111110001{str(i).zfill(2)}')

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/core/logs-auditoria/?page=1&page_size=5')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data['count'], 12)
        self.assertLessEqual(len(response.data['results']), 5)
        self.assertIsNotNone(response.data['next'])

    def test_rollback_editado_restores_values(self):
        self.client.force_authenticate(user=self.admin_user)

        edit_log = AuditLog.objects.filter(tabela='core.Cliente', acao='Editado').first()
        self.assertIsNotNone(edit_log)

        response = self.client.post(f'/api/core/logs-auditoria/{edit_log.pk}/rollback/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.cliente.refresh_from_db()
        self.assertEqual(self.cliente.nome_razao, 'Teste LTDA')

        rollback_log = AuditLog.objects.filter(acao='Rollback').first()
        self.assertIsNotNone(rollback_log)
        self.assertEqual(rollback_log.usuario, 'admin')
        self.assertIn('restored_from_log_id', rollback_log.detalhes)

    def test_rollback_criado_deletes_record(self):
        new_cliente = Cliente.objects.create(
            nome_razao='Para Deletar LTDA',
            cpf_cnpj='99999999000199',
        )
        pk = new_cliente.pk

        self.client.force_authenticate(user=self.admin_user)
        create_log = AuditLog.objects.filter(tabela='core.Cliente', acao='Criado', registro_id=str(pk)).first()
        self.assertIsNotNone(create_log)

        response = self.client.post(f'/api/core/logs-auditoria/{create_log.pk}/rollback/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertFalse(Cliente.objects.filter(pk=pk).exists())

        rollback_log = AuditLog.objects.filter(acao='Rollback', registro_id=str(pk)).first()
        self.assertIsNotNone(rollback_log)
        self.assertIn('criação', rollback_log.detalhamento)

    def test_rollback_excluido_blocked(self):
        cliente = Cliente.objects.create(
            nome_razao='Para Excluir LTDA',
            cpf_cnpj='88888888000188',
        )
        pk = cliente.pk
        cliente.delete()

        self.client.force_authenticate(user=self.admin_user)
        delete_log = AuditLog.objects.filter(tabela='core.Cliente', acao='Excluído', registro_id=str(pk)).first()
        self.assertIsNotNone(delete_log)

        response = self.client.post(f'/api/core/logs-auditoria/{delete_log.pk}/rollback/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('exclusão', response.data['error'].lower())

    def test_rollback_nonexistent_record(self):
        self.client.force_authenticate(user=self.admin_user)
        log = AuditLog.objects.create(
            usuario='Sistema',
            tabela='core.Cliente',
            registro_id='99999',
            acao=AuditLogAcao.EDITADO,
            detalhes={'nome_razao': 'Fantasma LTDA', 'cpf_cnpj': '000'},
        )
        response = self.client.post(f'/api/core/logs-auditoria/{log.pk}/rollback/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_rollback_unknown_model(self):
        self.client.force_authenticate(user=self.admin_user)
        log = AuditLog.objects.create(
            usuario='Sistema',
            tabela='inexistent.Model',
            registro_id='1',
            acao=AuditLogAcao.EDITADO,
            detalhes={},
        )
        response = self.client.post(f'/api/core/logs-auditoria/{log.pk}/rollback/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


@override_settings(DATABASES=TEST_DB)
class AuditLogForeignKeyRollbackTest(APITestCase):
    """Testa rollback com FKs corretamente resolvidos."""

    def setUp(self):
        clear_thread_local()
        self.client_admin = APIClient()
        self.admin_user = User.objects.create_user(
            username='admin', password='admin123', is_staff=True, is_superuser=True
        )
        self.client_admin.force_authenticate(user=self.admin_user)

        self.marca = Marca.objects.create(nome_marca='Toyota')
        self.modelo = Modelo.objects.create(nome_modelo='Corolla', marca=self.marca)
        self.versao = Versao.objects.create(
            modelo=self.modelo,
            nome_versao='XEi 2.0 Flex',
        )
        self.cliente = Cliente.objects.create(
            nome_razao='Joao Silva',
            cpf_cnpj='11122233344',
        )

    def test_rollback_fk_resolves_related_object(self):
        original_km = 50000
        ativo = Ativo.objects.create(
            placa='ABC1234',
            chassi='9BWZZZ377VT004251',
            cliente=self.cliente,
            versao=self.versao,
            ano_fabricacao=2020,
            km=original_km,
        )

        create_logs = AuditLog.objects.filter(acao='Criado', registro_id=str(ativo.pk))
        self.assertGreaterEqual(create_logs.count(), 1)

        old_km = ativo.km
        ativo.km = 75000
        ativo.save()

        edit_log = AuditLog.objects.filter(
            tabela='veiculos.Ativo', acao='Editado', registro_id=str(ativo.pk)
        ).first()
        self.assertIsNotNone(edit_log)

        response = self.client_admin.post(f'/api/core/logs-auditoria/{edit_log.pk}/rollback/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        ativo.refresh_from_db()
        self.assertEqual(ativo.km, old_km)


@override_settings(DATABASES=TEST_DB)
class MiddlewareTest(TestCase):
    """Testa o CurrentUserMiddleware."""

    def setUp(self):
        clear_thread_local()

    def test_middleware_stores_user(self):
        factory = RequestFactory()
        user = User.objects.create_user(username='testuser', password='pass')
        request = factory.get('/')
        request.user = user

        middleware = CurrentUserMiddleware(lambda r: MagicMock())
        middleware(request)

        self.assertEqual(get_current_user(), user)

    def test_middleware_handles_no_user(self):
        factory = RequestFactory()
        request = factory.get('/')

        middleware = CurrentUserMiddleware(lambda r: MagicMock())
        middleware(request)

        self.assertIsNone(get_current_user())


@override_settings(DATABASES=TEST_DB)
class AuditLogErrorLoggingTest(TestCase):
    """Testa que erros são logados corretamente ao invés de print."""

    def setUp(self):
        clear_thread_local()

    @patch('core.signals.logger')
    def test_signal_error_logged_not_printed(self, mock_logger):
        with patch('core.signals._serialize_instance', side_effect=Exception('Serialization fail')):
            Cliente.objects.create(nome_razao='Error Test', cpf_cnpj='00000000000100')

        mock_logger.error.assert_called_once()
        call_args = mock_logger.error.call_args[0][0]
        self.assertIn('Erro ao gerar log', call_args)
