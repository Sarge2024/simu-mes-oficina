import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Cliente
from veiculos.models import Ativo, Versao, Modelo, Marca
from operacional.models import OrdemServico, StatusOS

cliente1 = Cliente.objects.first()

marca_vw, _ = Marca.objects.get_or_create(nome_marca="VW")
modelo_gol, _ = Modelo.objects.get_or_create(marca=marca_vw, nome_modelo="GOL")
versao_gol, _ = Versao.objects.get_or_create(modelo=modelo_gol, nome_versao="1.0")

marca_scania, _ = Marca.objects.get_or_create(nome_marca="SCANIA")
modelo_r450, _ = Modelo.objects.get_or_create(marca=marca_scania, nome_modelo="R450")
versao_r450, _ = Versao.objects.get_or_create(modelo=modelo_r450, nome_versao="V8")

marca_fiat, _ = Marca.objects.get_or_create(nome_marca="FIAT")
modelo_argo, _ = Modelo.objects.get_or_create(marca=marca_fiat, nome_modelo="ARGO")
versao_argo, _ = Versao.objects.get_or_create(modelo=modelo_argo, nome_versao="1.3")

veiculo_101, _ = Ativo.objects.get_or_create(placa="XYZ-9876", defaults={"tenant_id": 1, "cliente": cliente1, "versao": versao_gol, "ano_fabricacao": 2020, "chassi": "CHAS101"})
veiculo_104, _ = Ativo.objects.get_or_create(placa="JKL-5566", defaults={"tenant_id": 1, "cliente": cliente1, "versao": versao_r450, "ano_fabricacao": 2018, "chassi": "CHAS104"})
veiculo_107, _ = Ativo.objects.get_or_create(placa="DEF-8899", defaults={"tenant_id": 1, "cliente": cliente1, "versao": versao_argo, "ano_fabricacao": 2021, "chassi": "CHAS107"})

OrdemServico.objects.get_or_create(id=101, defaults={"tenant_id": 1, "veiculo": veiculo_101, "status": StatusOS.EM_DIAGNOSTICO})
OrdemServico.objects.get_or_create(id=104, defaults={"tenant_id": 1, "veiculo": veiculo_104, "status": StatusOS.AGUARDANDO_APROVACAO})
OrdemServico.objects.get_or_create(id=107, defaults={"tenant_id": 1, "veiculo": veiculo_107, "status": StatusOS.AGUARDANDO_APROVACAO})

print("OS mocks seeded!")
