import django
import sys
import os

sys.path.append('/mnt/46F84CA3F84C935B/SAGACITAS_SaaS/SIMU_MES Oficina/backend/django_app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from catalogo.models import ReferenciaFabricante
from veiculos.models import Marca

try:
    marca_brasved = Marca.objects.get(nome_marca='BRASVED')
    ReferenciaFabricante.objects.filter(marca=marca_brasved).delete()
    print("Referencias da BRASVED removidas com sucesso.")
except Exception as e:
    print(f"Erro: {e}")
