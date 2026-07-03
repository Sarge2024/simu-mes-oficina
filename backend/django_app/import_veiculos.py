"""
Importação do Catálogo FIPE — Lista veiculos 2.CSV

Fluxo em 4 fases:
  1. MARCAS    → veic_marca
  2. MODELOS   → veic_modelo (FK → Marca)
  3. VERSOES   → veic_versao (FK → Modelo, cod_fipe unique)
  4. COTACOES  → veic_cotacao_mercado (FK → Versao, 15 colunas de ano)

Compatibilidade verificada:
  - 11.758 linhas no CSV
  - 435 marcas (20 vazias → ignoradas)
  - 11.727 códigos FIPE únicos (chave primária lógica)
  - 15 colunas de ano (2002-2016), ~38.606 valores preenchidos
  - Combustível: G=8280, D=3446, Comb=31, vazio=1
  - Categorias FIPE mapeadas para CategoriaVeiculo do Django
"""

import os
import sys
import csv
import time
import django
from decimal import Decimal, InvalidOperation
from django.db import transaction
from collections import defaultdict

# ── Setup ──────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from veiculos.models import (
    Marca, Modelo, Versao, CotacaoMercado,
    CategoriaVeiculo, TipoCombustivel,
)

CSV_PATH = os.path.join(
    os.path.dirname(os.path.dirname(BASE_DIR)),
    'Lista veiculos 2.CSV'
)

YEAR_COLS = ['2016', '2015', '2014', '2013', '2012',
             '2011', '2010', '2009', '2008', '2007',
             '2006', '2005', '2004', '2003', '2002']

# ── Mappers ────────────────────────────────────────────────

def map_categoria(cat_str: str) -> str:
    """TABELA A-F → choices do Modelo.categoria_veiculo."""
    c = cat_str.upper()
    if 'AUTOM' in c:       return CategoriaVeiculo.CARRO
    if 'MOTO' in c:        return CategoriaVeiculo.MOTO
    if 'CAMINHON' in c:    return CategoriaVeiculo.UTILITARIO
    if 'CAMINHO' in c:     return CategoriaVeiculo.CAMINHAO
    if 'ONIB' in c:        return CategoriaVeiculo.ONIBUS
    if 'MOTOCASA' in c:    return CategoriaVeiculo.OUTRO
    return CategoriaVeiculo.OUTRO


def map_combustivel(raw: str) -> str:
    """Valor do CSV → TipoCombustivel (1 char)."""
    c = raw.strip().upper()
    table = {
        'G': TipoCombustivel.GASOLINA,
        'A': TipoCombustivel.ALCOOL,
        'F': TipoCombustivel.FLEX,
        'D': TipoCombustivel.DIESEL,
        'E': TipoCombustivel.ELETRICO,
        'H': TipoCombustivel.HIBRIDO,
        'GASOLINA': TipoCombustivel.GASOLINA,
        'ALCOOL': TipoCombustivel.ALCOOL,
        'FLEX': TipoCombustivel.FLEX,
        'DIESEL': TipoCombustivel.DIESEL,
        'ELETRICO': TipoCombustivel.ELETRICO,
        'HIBRIDO': TipoCombustivel.HIBRIDO,
        'COMB': TipoCombustivel.GASOLINA,  # fallback
    }
    return table.get(c, TipoCombustivel.FLEX)


def clean_currency(value: str) -> Decimal | None:
    """'R$ 28.059,00' → Decimal('28059.00')."""
    if not value or not value.strip():
        return None
    try:
        clean = value.replace('R$', '').replace('.', '').replace(',', '.').strip()
        return Decimal(clean)
    except (InvalidOperation, ValueError):
        return None


def log(msg: str):
    print(f"  {msg}")


# ── Phase 1: Marcas ────────────────────────────────────────

def phase_marcas(rows: list[dict]) -> dict[str, int]:
    """Cria/obtém todas as Marcas. Retorna {nome_upper: id}."""
    log("FASE 1 — Marcas")

    # Collect all unique non-empty fabricantes
    fabricantes = set()
    skipped = 0
    for row in rows:
        nome = row.get('Fabricante', '').strip()
        if nome:
            fabricantes.add(nome)
        else:
            skipped += 1

    log(f"  {len(fabricantes)} fabricantes únicos ({skipped} ignorados por nome vazio)")

    # Bulk upsert via get_or_create
    cache = {}
    created = 0
    existing = 0

    for nome in sorted(fabricantes):
        obj, is_new = Marca.objects.get_or_create(nome_marca=nome)
        cache[nome] = obj.id
        if is_new:
            created += 1
        else:
            existing += 1

    log(f"  Criadas: {created}, Já existiam: {existing}")
    return cache


# ── Phase 2: Modelos ───────────────────────────────────────

def phase_modelos(rows: list[dict], marca_cache: dict[str, int]) -> dict[str, int]:
    """Cria/obtém Modelos. Retorna {(marca_id, nome_upper): id}."""
    log("FASE 2 — Modelos")

    # Collect unique (marca, modelo_nome) combos
    modelo_keys = set()
    skipped = 0
    for row in rows:
        fab = row.get('Fabricante', '').strip()
        modelo_raw = row.get('Modelo', '').strip()
        if not fab or not modelo_raw:
            skipped += 1
            continue

        categoria = map_categoria(row.get('Categoria', ''))
        marca_id = marca_cache.get(fab)
        if not marca_id:
            skipped += 1
            continue

        modelo_keys.add((marca_id, modelo_raw, categoria))

    log(f"  {len(modelo_keys)} combos (marca, modelo) únicos ({skipped} ignorados)")

    cache = {}
    created = 0
    existing = 0

    for marca_id, modelo_nome, categoria in sorted(modelo_keys):
        obj, is_new = Modelo.objects.get_or_create(
            marca_id=marca_id,
            nome_modelo=modelo_nome,
            defaults={'categoria_veiculo': categoria}
        )
        cache[(marca_id, modelo_nome)] = obj.id
        if is_new:
            created += 1
        else:
            existing += 1

    log(f"  Criados: {created}, Já existiam: {existing}")
    return cache


# ── Phase 3: Versoes ──────────────────────────────────────

def phase_versoes(rows: list[dict], modelo_cache: dict[str, int], marca_cache: dict[str, int]) -> dict[str, int]:
    """Cria/obtém Versões por codigo_fipe. Retorna {codigo_fipe: id}."""
    log("FASE 3 — Versões (FIPE)")

    # Collect unique versoes by codigo_fipe
    versao_data = {}
    skipped = 0
    for row in rows:
        codigo = row.get('Cod.', '').strip()
        if not codigo:
            skipped += 1
            continue

        fab = row.get('Fabricante', '').strip()
        modelo_raw = row.get('Modelo', '').strip()
        if not fab or not modelo_raw:
            skipped += 1
            continue

        marca_id = marca_cache.get(fab)
        modelo_id = modelo_cache.get((marca_id, modelo_raw)) if marca_id else None
        if not modelo_id:
            skipped += 1
            continue

        combustivel = map_combustivel(row.get('Combustivel', ''))

        # If same FIPE code appears multiple times, keep first (or merge)
        if codigo not in versao_data:
            versao_data[codigo] = {
                'modelo_id': modelo_id,
                'nome_versao': modelo_raw,  # Nome completo como nome da versão
                'combustivel': combustivel,
            }

    log(f"  {len(versao_data)} versões únicas ({skipped} ignoradas)")

    # Bulk check existing
    existing_codes = set(
        Versao.objects.filter(codigo_fipe__in=versao_data.keys())
        .values_list('codigo_fipe', flat=True)
    )

    # Create missing ones
    created = 0
    updated = 0

    for codigo, data in versao_data.items():
        if codigo in existing_codes:
            updated += 1
            continue

        try:
            Versao.objects.create(
                codigo_fipe=codigo,
                modelo_id=data['modelo_id'],
                nome_versao=data['nome_versao'],
                combustivel=data['combustivel'],
                ativo=True,
            )
            created += 1
        except Exception as e:
            log(f"  ERRO criando versao FIPE={codigo}: {e}")

    log(f"  Criadas: {created}, Já existiam: {updated}")

    # Build final cache {codigo_fipe: versao_id}
    cache = {}
    for codigo in versao_data:
        try:
            v = Versao.objects.get(codigo_fipe=codigo)
            cache[codigo] = v.id
        except Versao.DoesNotExist:
            pass

    return cache


# ── Phase 4: Cotacoes ─────────────────────────────────────

def phase_cotacoes(rows: list[dict], versao_cache: dict[str, int]):
    """Popula veic_cotacao_mercado com valores por ano."""
    log("FASE 4 — Cotações de Mercado")

    # Collect all (versao_id, ano) → valor
    cotacoes = {}
    total_filled = 0

    for row in rows:
        codigo = row.get('Cod.', '').strip()
        versao_id = versao_cache.get(codigo)
        if not versao_id:
            continue

        for ano_str in YEAR_COLS:
            valor = clean_currency(row.get(ano_str, ''))
            if valor:
                key = (versao_id, int(ano_str))
                if key not in cotacoes:
                    cotacoes[key] = valor
                    total_filled += 1

    log(f"  {total_filled} cotações a inserir/atualizar")

    # Batch insert using bulk_create
    objs_to_create = []
    for (versao_id, ano), valor in cotacoes.items():
        objs_to_create.append(
            CotacaoMercado(
                versao_id=versao_id,
                ano_referencia=ano,
                valor=valor,
            )
        )

    # Use bulk_create with ignore_conflicts for idempotency
    created = 0
    batch_size = 500
    for i in range(0, len(objs_to_create), batch_size):
        batch = objs_to_create[i:i + batch_size]
        try:
            CotacaoMercado.objects.bulk_create(
                batch,
                ignore_conflicts=True,
            )
            created += len(batch)
        except Exception as e:
            log(f"  ERRO no batch {i}: {e}")

    log(f"  Inseridas: {created}")


# ── Main ───────────────────────────────────────────────────

def main():
    if not os.path.exists(CSV_PATH):
        print(f"ERRO: Arquivo não encontrado em {CSV_PATH}")
        sys.exit(1)

    print(f"\n{'='*60}")
    print(f"  Importação FIPE — {os.path.basename(CSV_PATH)}")
    print(f"{'='*60}\n")

    t0 = time.time()

    # Read CSV
    with open(CSV_PATH, mode='r', encoding='latin-1') as f:
        reader = csv.DictReader(f, delimiter=';')
        rows = list(reader)
    log(f"CSV lido: {len(rows)} linhas")

    # Phase 1: Marcas
    marca_cache = phase_marcas(rows)

    # Phase 2: Modelos (depends on Marcas)
    modelo_cache = phase_modelos(rows, marca_cache)

    # Phase 3: Versoes (depends on Modelos)
    versao_cache = phase_versoes(rows, modelo_cache, marca_cache)

    # Phase 4: Cotacoes (depends on Versoes)
    phase_cotacoes(rows, versao_cache)

    elapsed = time.time() - t0
    print(f"\n{'='*60}")
    print(f"  Importação concluída em {elapsed:.1f}s")
    print(f"  Marcas:    {len(marca_cache)}")
    print(f"  Modelos:   {len(modelo_cache)}")
    print(f"  Versões:   {len(versao_cache)}")
    print(f"{'='*60}\n")


if __name__ == '__main__':
    main()
