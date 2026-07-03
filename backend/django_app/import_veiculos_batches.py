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
    if not value or value == '0': return None
    try:
        # Remove R$, pontos de milhar e troca vírgula por ponto
        cleaned = value.replace('R$', '').replace('.', '').replace(',', '.').strip()
        return Decimal(cleaned)
    except:
        return None

def map_categoria(csv_cat):
    csv_cat = csv_cat.upper()
    if 'CARRO' in csv_cat or 'PASSAGEIRO' in csv_cat: return CategoriaVeiculo.CARRO
    if 'MOTO' in csv_cat: return CategoriaVeiculo.MOTO
    if 'CAMINHAO' in csv_cat: return CategoriaVeiculo.CAMINHAO
    if 'ONIBUS' in csv_cat: return CategoriaVeiculo.ONIBUS
    if 'UTILITARIO' in csv_cat: return CategoriaVeiculo.UTILITARIO
    return CategoriaVeiculo.OUTRO

def import_in_batches(csv_path, batch_size=500):
    print(f"Iniciando importação em lotes de {batch_size}...")
    
    if not os.path.exists(csv_path):
        print(f"Erro: Arquivo {csv_path} não encontrado.")
        return

    with open(csv_path, mode='r', encoding='latin-1') as f:
        reader = list(csv.DictReader(f, delimiter=';'))
        total_rows = len(reader)
        print(f"Total de registros no CSV: {total_rows}")

        # Cache para evitar queries repetitivas de Marca e Modelo
        marcas_cache = {m.nome_marca: m for m in Marca.objects.all()}
        modelos_cache = {} # Key: (marca_id, nome_modelo)

        cotacoes_to_create = []
        
        for i in range(0, total_rows, batch_size):
            batch = reader[i : i + batch_size]
            
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

                        # 2. Modelo
                        nome_completo = row['Modelo'].strip()
                        nome_modelo_base = nome_completo
                        if nome_modelo_base.upper().startswith(nome_marca):
                            nome_modelo_base = nome_modelo_base[len(nome_marca):].strip()
                        
                        base_agg = nome_modelo_base.split(' ')[0]
                        model_key = (marca.id, base_agg)
                        
                        if model_key not in modelos_cache:
                            modelo, _ = Modelo.objects.get_or_create(
                                marca=marca, 
                                nome_modelo=base_agg,
                                defaults={'categoria_veiculo': map_categoria(row['Categoria'])}
                            )
                            modelos_cache[model_key] = modelo
                        else:
                            modelo = modelos_cache[model_key]

                        # 3. Versão
                        codigo_fipe = row['Cód.'].strip()
                        combustivel = row['Combustivel'].strip().upper()
                        if combustivel not in [c[0] for c in TipoCombustivel.choices]:
                            combustivel = TipoCombustivel.FLEX

                        versao, created = Versao.objects.update_or_create(
                            codigo_fipe=codigo_fipe,
                            defaults={
                                'modelo': modelo,
                                'nome_versao': nome_completo,
                                'combustivel': combustivel,
                                'ativo': True
                            }
                        )

                        # 4. Cotações (Coleta para bulk_create posterior ou update_or_create se precisar de ID)
                        anos = [str(y) for y in range(2002, 2017)]
                        for ano_str in anos:
                            valor_decimal = clean_currency(row.get(ano_str))
                            if valor_decimal:
                                # Usamos update_or_create para garantir que não duplicamos se rodar 2x
                                CotacaoMercado.objects.update_or_create(
                                    versao=versao,
                                    ano_referencia=int(ano_str),
                                    defaults={'valor': valor_decimal}
                                )
                                
                    except Exception as e:
                        print(f"Erro no registro {row.get('Cód.')}: {e}")

            print(f"Lote {i//batch_size + 1} concluído ({min(i + batch_size, total_rows)}/{total_rows})")

    print("\nImportação de alta performance concluída com sucesso!")

if __name__ == "__main__":
    csv_file = "/mnt/46F84CA3F84C935B/SAGACITAS_SaaS/SIMU_MES Oficina/Lista veiculos 2.CSV"
    import_in_batches(csv_file)
