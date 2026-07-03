import os
import sys

# Add the /app directory to the Python path
sys.path.insert(0, '/app')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from veiculos.models import Categoria

c, created = Categoria.objects.get_or_create(nome='carro', defaults={'ativo': True})
print(f"Categoria 'carro' (ID: {c.id}) - Created: {created}, Ativo: {c.ativo}")

c2, created2 = Categoria.objects.get_or_create(nome='Carro', defaults={'ativo': True})
print(f"Categoria 'Carro' (ID: {c2.id}) - Created: {created2}, Ativo: {c2.ativo}")
