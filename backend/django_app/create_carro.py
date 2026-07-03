import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from veiculos.models import Categoria

c, created = Categoria.objects.get_or_create(nome='Carro', defaults={'ativo': True})
print(f"Categoria 'Carro' (ID: {c.id}) - Created: {created}, Ativo: {c.ativo}")
