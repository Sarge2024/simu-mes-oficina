import django
import sys
import os
from decimal import Decimal
from datetime import datetime, timedelta

sys.path.append('/mnt/46F84CA3F84C935B/SAGACITAS_SaaS/SIMU_MES Oficina/backend/django_app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Cliente, Colaborador
from veiculos.models import Ativo, Marca, Modelo, Versao
from catalogo.models import Componente, ServicoCatalogo
from operacional.models import OrdemServico, StatusOS, Orcamento, OrcamentoItem

def seed_operacional():
    print("Iniciando seed operacional...")
    
    # 1. Cliente
    cliente, _ = Cliente.objects.get_or_create(
        nome_razao="Transportadora Norte",
        defaults={
            "tenant_id": 1,
            "apelido_fantasia": "TransNorte",
            "cpf_cnpj": "12345678000199",
            "email": "contato@transnorte.com.br"
        }
    )
    
    # 2. Veículo (Ativo)
    marca = Marca.objects.filter(nome_marca="FIAT").first()
    modelo, _ = Modelo.objects.get_or_create(marca=marca, nome_modelo="UNO")
    versao, _ = Versao.objects.get_or_create(modelo=modelo, nome_versao="1.0 FIRE")
    
    veiculo, _ = Ativo.objects.get_or_create(
        placa="ABC-1234",
        defaults={
            "tenant_id": 1,
            "cliente": cliente,
            "versao": versao,
            "ano_fabricacao": 2015,
            "cor": "Branco"
        }
    )
    
    # 3. Colaboradores
    mecanico, _ = Colaborador.objects.get_or_create(
        nome="João Silva",
        defaults={"cargo": "Mecânico", "especialidade": "Motor", "custo_hora": 45.00}
    )
    
    # 4. Serviços no Catálogo
    servico_mo, _ = ServicoCatalogo.objects.get_or_create(
        codigo="MO-MOTOR-01",
        defaults={
            "descricao": "Retifica de Cabeçote",
            "preco_base": 150.00,
            "tempo_padrao": 4.0 # 240 / 60
        }
    )
    
    # 5. Ordens de Serviço (Casos do Agenda)
    # OS #101 - Em Diagnóstico
    os101, _ = OrdemServico.objects.get_or_create(
        id=101,
        defaults={
            "tenant_id": 1,
            "veiculo": veiculo,
            "status": StatusOS.EM_DIAGNOSTICO,
            "descricao_problema": "Vazamento de óleo e fumaça azulada",
            "km_entrada": 125000
        }
    )
    
    # OS #103 - Em Execução
    os103, _ = OrdemServico.objects.get_or_create(
        id=103,
        defaults={
            "tenant_id": 1,
            "veiculo": veiculo,
            "status": StatusOS.EM_EXECUCAO,
            "descricao_problema": "Revisão Geral",
            "km_entrada": 125500
        }
    )
    
    # 6. Criar Orçamento para OS 103 (para ter algo "existente")
    orc103, _ = Orcamento.objects.get_or_create(
        os=os103,
        versao=1,
        defaults={
            "tenant_id": 1,
            "is_active": True,
            "status_aprovacao": "aprovado",
            "valor_total": 500.00
        }
    )
    
    print("Seed operacional concluído com sucesso!")

if __name__ == "__main__":
    seed_operacional()
