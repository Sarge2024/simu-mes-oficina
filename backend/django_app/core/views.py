import logging
from django.apps import apps
from django.db import transaction
from django.db.models.fields.related import ForeignKey, ManyToManyField, OneToOneField
from django.utils import timezone
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import EmpresaFilial, Cliente, AuditLog, AuditLogAcao
from .serializers import EmpresaFilialSerializer, ClienteSerializer, AuditLogSerializer

logger = logging.getLogger(__name__)


from .middleware import get_current_tenant, is_master_request

class TenantModelViewSet(viewsets.ModelViewSet):
    """ViewSet base que filtra o queryset pelo tenant atual e define o tenant na criação."""
    
    def get_queryset(self):
        qs = super().get_queryset()
        tenant_id = get_current_tenant()
        if tenant_id:
            return qs.filter(tenant_id=tenant_id)
        # MASTER sem tenant selecionado → visão global de todos os registros
        if is_master_request():
            return qs
        return qs.none()

    def perform_create(self, serializer):
        tenant_id = get_current_tenant()
        serializer.save(tenant_id=tenant_id)


class EmpresaFilialViewSet(viewsets.ModelViewSet):
    queryset = EmpresaFilial.objects.all()
    serializer_class = EmpresaFilialSerializer
    permission_classes = [permissions.AllowAny]


class ClienteViewSet(TenantModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [permissions.AllowAny]


class AuditLogViewSet(viewsets.ModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    @action(detail=True, methods=['post'])
    def rollback(self, request, pk=None):
        log = self.get_object()

        if log.acao == AuditLogAcao.EXCLUIDO:
            return Response({"error": "Não é possível fazer rollback de exclusão via este método."}, status=400)

        model = self._resolve_model(log.tabela)
        if not model:
            return Response({"error": f"Modelo {log.tabela} não encontrado."}, status=404)

        try:
            with transaction.atomic():
                if log.acao == AuditLogAcao.CRIADO:
                    return self._rollback_criado(model, log, request.user)
                else:
                    return self._rollback_editado(model, log, request.user)
        except model.DoesNotExist:
            return Response({"error": "Registro original não existe mais no banco de dados."}, status=404)
        except Exception as e:
            logger.error(f"Erro durante rollback de {log.tabela}#{log.registro_id}: {str(e)}", exc_info=True)
            return Response({"error": f"Erro durante o rollback: {str(e)}"}, status=500)

    def _rollback_criado(self, model, log, user):
        """Rollback de 'Criado' significa apagar o registro que foi criado."""
        instance = model.objects.get(pk=log.registro_id)

        snapshot_pre_delete = {f.name: self._serialize_value(getattr(instance, f.name, None), f) for f in model._meta.fields}

        instance.delete()

        AuditLog.objects.create(
            usuario=user.get_username(),
            tabela=log.tabela,
            registro_id=log.registro_id,
            acao=AuditLogAcao.ROLLBACK,
            detalhes={"acao_original": "Criado", "motivo": "Rollback de criação - registro removido"},
            detalhamento=f"Rollback da criação do registro #{log.registro_id} em {log.tabela}. Registro removido.",
        )

        return Response({"status": "Rollback de criação realizado. Registro removido com sucesso."})

    def _rollback_editado(self, model, log, request_user):
        """Rollback de 'Editado' restaura os campos do snapshot."""
        instance = model.objects.get(pk=log.registro_id)

        snapshot_pre_rollback = {f.name: self._serialize_value(getattr(instance, f.name, None), f) for f in model._meta.fields if not getattr(f, 'auto_now', False)}

        data_to_restore = log.detalhes.copy()

        for field in model._meta.get_fields():
            if isinstance(field, ManyToManyField):
                continue

            field_name = field.name
            if field_name in ('id',):
                continue

            if getattr(field, 'auto_now', False):
                continue

            if field_name in data_to_restore:
                raw_value = data_to_restore[field_name]
                if isinstance(field, (ForeignKey, OneToOneField)):
                    if raw_value is None:
                        setattr(instance, field_name, None)
                    else:
                        related_model = field.related_model
                        try:
                            related_instance = related_model.objects.get(pk=raw_value)
                            setattr(instance, field_name, related_instance)
                        except related_model.DoesNotExist:
                            logger.warning(f"FK {field_name} -> {related_model._meta.label}#{raw_value} não existe, mantendo valor atual.")
                else:
                    if hasattr(instance, field_name):
                        setattr(instance, field_name, raw_value)

        instance.save(update_fields=[f.name for f in model._meta.fields if f.name in data_to_restore and f.name not in ('id',) and hasattr(instance, f.name) and not getattr(f, 'auto_now', False)])

        changes = []
        for field_name, restored_val in data_to_restore.items():
            prev_val = snapshot_pre_rollback.get(field_name)
            if str(prev_val) != str(restored_val):
                changes.append(f"• {field_name}: '{prev_val}' ➔ '{restored_val}'")

        AuditLog.objects.create(
            usuario=request_user.get_username(),
            tabela=log.tabela,
            registro_id=log.registro_id,
            acao=AuditLogAcao.ROLLBACK,
            detalhes={
                "restored_from_log_id": log.id,
                "restored_to": data_to_restore,
                "previous_state": snapshot_pre_rollback,
            },
            detalhamento=f"Rollback para estado anterior (log #{log.id}) em {log.tabela}#{log.registro_id}:\n" + "\n".join(changes) if changes else f"Rollback realizado sem alterações detectadas.",
        )

        return Response({"status": "Rollback realizado com sucesso."})

    def _resolve_model(self, tabela_label):
        """Resolve um model a partir do label (app.Model) ou verbose_name."""
        if '.' in tabela_label:
            try:
                return apps.get_model(tabela_label)
            except LookupError:
                pass

        for m in apps.get_models():
            if m._meta.verbose_name == tabela_label or m.__name__ == tabela_label:
                return m
        return None

    def _serialize_value(self, value, field):
        """Serializa um valor de campo para JSON."""
        if value is None:
            return None
        if hasattr(value, 'pk'):
            return value.pk
        return str(value) if hasattr(value, '__str__') else value
