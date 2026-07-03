import os
import sys

# Add the /app directory to the Python path
sys.path.insert(0, '/app')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from veiculos.models import Categoria

c, created = Categoria.objects.get_or_create(nome='Carro', defaults={'ativo': True})
print(f"Categoria 'Carro' (ID: {c.id}) - Created: {created}, Ativo: {c.ativo}")

if not c.ativo:
    c.ativo = True
    c.save()
    print("Set Carro as Ativo")
