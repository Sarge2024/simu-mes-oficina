import os
import sys
import csv
import django
from decimal import Decimal
from django.db import transaction

# 1. Configuração do ambiente Django
sys.path.append('/mnt/46F84CA3F84C935B/SAGACITAS_SaaS/SIMU_MES Oficina/backend/django_app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from veiculos.models import Marca, Modelo, Versao, CotacaoMercado, CategoriaVeiculo, TipoCombustivel

def clean_currency(value):
    if not value or value == '0' or value == '-': return None
    try:
        cleaned = value.replace('R$', '').replace('.', '').replace(',', '.').strip()
        return Decimal(cleaned)
    except:
        return None

def import_carros_only(csv_path, batch_size=1000):
    print(f"🚀 Iniciando Importação Especializada: CATEGORIA CARROS (Tabela A e B)")
    
    if not os.path.exists(csv_path):
        print(f"❌ Erro: Arquivo {csv_path} não encontrado.")
        return

    # Categorias do CSV que consideramos "Carros"
    CATEGORIAS_CARRO = ['TABELA A - AUTOMÓVEIS', 'TABELA B - CAMINHONETAS E UTILITÁRIOS']

    with open(csv_path, mode='r', encoding='latin-1') as f:
        reader = list(csv.DictReader(f, delimiter=';'))
        
        # Filtra apenas registros de carros
        records = [r for r in reader if any(cat in r.get('Categoria', '') for cat in CATEGORIAS_CARRO)]
        total_records = len(records)
        
        print(f"📊 Registros de Carros encontrados: {total_records}")

        marcas_cache = {m.nome_marca: m for m in Marca.objects.all()}
        modelos_cache = {}

        for i in range(0, total_records, batch_size):
            batch = records[i : i + batch_size]
            
            with transaction.atomic():
                for row in batch:
                    try:
                        # 1. Marca
                        nome_marca = row['Fabricante'].strip().upper()
                        if nome_marca not in marcas_cache:
                            marca, _ = Marca.objects.get_or_create(nome_marca=nome_marca)
                            marcas_cache[nome_marca] = marca
                        else:
                            marca = marcas_cache[nome_marca]

                        # 2. Modelo (Simplificação do nome)
                        nome_completo = row['Modelo'].strip()
                        nome_modelo_base = nome_completo.split(' ')[0] # Pega a primeira palavra como modelo base
                        
                        model_key = (marca.id, nome_modelo_base)
                        if model_key not in modelos_cache:
                            modelo, _ = Modelo.objects.get_or_create(
                                marca=marca, 
                                nome_modelo=nome_modelo_base,
                                defaults={'categoria_veiculo': CategoriaVeiculo.CARRO}
                            )
                            modelos_cache[model_key] = modelo
                        else:
                            modelo = modelos_cache[model_key]

                        # 3. Versão
                        codigo_fipe = row['Cód.'].strip()
                        combustivel_raw = row['Combustivel'].strip().upper()
                        
                        # Mapeamento simples de combustível
                        combustivel = TipoCombustivel.FLEX
                        if 'DIESEL' in combustivel_raw: combustivel = TipoCombustivel.DIESEL
                        elif 'GASOLINA' in combustivel_raw: combustivel = TipoCombustivel.GASOLINA
                        elif 'ÁLCOOL' in combustivel_raw or 'ALCOOL' in combustivel_raw: combustivel = TipoCombustivel.ALCOOL

                        versao, _ = Versao.objects.update_or_create(
                            codigo_fipe=codigo_fipe,
                            defaults={
                                'modelo': modelo,
                                'nome_versao': nome_completo,
                                'combustivel': combustivel,
                                'ativo': True
                            }
                        )

                        # 4. Cotações (Anos 2002 a 2016)
                        for ano in range(2002, 2017):
                            valor = clean_currency(row.get(str(ano)))
                            if valor:
                                CotacaoMercado.objects.update_or_create(
                                    versao=versao,
                                    ano_referencia=ano,
                                    defaults={'valor': valor}
                                )
                                
                    except Exception as e:
                        pass # Silencioso para manter velocidade, logar apenas se necessário

            print(f"✅ Lote {i//batch_size + 1} concluído ({min(i + batch_size, total_records)}/{total_records})")

    print("\n✨ Importação da Categoria CARROS finalizada com sucesso!")

if __name__ == "__main__":
    csv_file = "/mnt/46F84CA3F84C935B/SAGACITAS_SaaS/SIMU_MES Oficina/Lista veiculos 2.CSV"
    import_carros_only(csv_file)
