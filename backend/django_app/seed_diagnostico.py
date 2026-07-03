import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from catalogo.models import ServicoCatalogo

ServicoCatalogo.objects.get_or_create(
    codigo="DIA-001",
    defaults={
        "descricao": "Diagnóstico Eletrônico Avançado",
        "tempo_padrao": 1.50,
        "preco_base": 220.00,
        "especialidade": "Diagnóstico"
    }
)
print("Serviço de Diagnóstico semeado no banco com sucesso!")
