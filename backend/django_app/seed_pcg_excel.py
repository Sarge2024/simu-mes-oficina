import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from financeiro.models import PlanoContas, TipoNatureza

data = [{"Cod": "20000", "Descri\u00e7\u00e3o da Conta": "Despesas"}, {"Cod": "21000", "Descri\u00e7\u00e3o da Conta": "Manuten\u00e7\u00e3o Geral"}, {"Cod": "21100", "Descri\u00e7\u00e3o da Conta": "Manuten\u00e7\u00e3o Predial"}, {"Cod": "21110", "Descri\u00e7\u00e3o da Conta": "Manuten\u00e7\u00e3o Predial Eletrica"}, {"Cod": "21111", "Descri\u00e7\u00e3o da Conta": "Servi\u00e7os Terceirizados de Manuten\u00e7\u00e3o Predial Eletrica "}, {"Cod": "21120", "Descri\u00e7\u00e3o da Conta": "Manuten\u00e7\u00e3o Predial Civil"}, {"Cod": "21121", "Descri\u00e7\u00e3o da Conta": "Servi\u00e7os Terceirizados de Manuten\u00e7\u00e3o Predial Civil"}, {"Cod": "21130", "Descri\u00e7\u00e3o da Conta": "Manuten\u00e7\u00e3o Predial Hidro sanit\u00e1rio"}, {"Cod": "21131", "Descri\u00e7\u00e3o da Conta": "Servi\u00e7os Terceirizados de Manuten\u00e7\u00e3o Predial Hidro sanit\u00e1rio"}, {"Cod": "21140", "Descri\u00e7\u00e3o da Conta": "Servi\u00e7os de Manuten\u00e7\u00e3o Predial Outros"}, {"Cod": "21200", "Descri\u00e7\u00e3o da Conta": "Manuten\u00e7\u00e3o Veicular"}, {"Cod": "21210", "Descri\u00e7\u00e3o da Conta": "Combustiveis"}, {"Cod": "21220", "Descri\u00e7\u00e3o da Conta": "Eletro-mec\u00e2nica"}, {"Cod": "21300", "Descri\u00e7\u00e3o da Conta": "Manuten\u00e7\u00e3o Em Equipamentos"}, {"Cod": "21310", "Descri\u00e7\u00e3o da Conta": "Mec\u00e2nica (materiais)"}, {"Cod": "21131", "Descri\u00e7\u00e3o da Conta": "Servi\u00e7os Terceirizados de Manuten\u00e7\u00e3o Mec\u00e2nica"}, {"Cod": "21320", "Descri\u00e7\u00e3o da Conta": "Eletrica/Automa\u00e7\u00e3o (materiais)"}, {"Cod": "21321", "Descri\u00e7\u00e3o da Conta": "Servi\u00e7os Terceirizados de Manuten\u00e7\u00e3o El\u00e9trica"}, {"Cod": "21330", "Descri\u00e7\u00e3o da Conta": "Refrigera\u00e7\u00e3o (materiais)"}, {"Cod": "21331", "Descri\u00e7\u00e3o da Conta": "Servi\u00e7os Terceirizados de Manuten\u00e7\u00e3o em Refrigera\u00e7\u00e3o"}, {"Cod": "21500", "Descri\u00e7\u00e3o da Conta": "Mobili\u00e1rio (patrimonial)"}, {"Cod": "21510", "Descri\u00e7\u00e3o da Conta": "Servi\u00e7os de Manuten\u00e7\u00e3o Moveis"}, {"Cod": "21520", "Descri\u00e7\u00e3o da Conta": "Servi\u00e7os Terceirizados de Manuten\u00e7\u00e3o de mobili\u00e1rio"}, {"Cod": "22000", "Descri\u00e7\u00e3o da Conta": "Investimentos"}, {"Cod": "22100", "Descri\u00e7\u00e3o da Conta": "Melhorias"}, {"Cod": "22200", "Descri\u00e7\u00e3o da Conta": "Melhorias em Processos"}, {"Cod": "22300", "Descri\u00e7\u00e3o da Conta": "Melhorias em Atendimento"}, {"Cod": "22400", "Descri\u00e7\u00e3o da Conta": "Fabrica\u00e7\u00e3o (equipamentos)"}, {"Cod": "23000", "Descri\u00e7\u00e3o da Conta": "Despesas Administrativas"}, {"Cod": "23200", "Descri\u00e7\u00e3o da Conta": "Materiais"}, {"Cod": "23210", "Descri\u00e7\u00e3o da Conta": "Materiais de Limpeza"}, {"Cod": "23220", "Descri\u00e7\u00e3o da Conta": "Materiais de Escritorio"}, {"Cod": "23100", "Descri\u00e7\u00e3o da Conta": "Contas"}, {"Cod": "23300", "Descri\u00e7\u00e3o da Conta": "Despesas de Pessoal"}, {"Cod": "23310", "Descri\u00e7\u00e3o da Conta": "Pagamento (salarios + horas extras)"}, {"Cod": "23311", "Descri\u00e7\u00e3o da Conta": "Salarios"}, {"Cod": "23312", "Descri\u00e7\u00e3o da Conta": "Horas Extras"}, {"Cod": "23320", "Descri\u00e7\u00e3o da Conta": "Treinamento"}, {"Cod": "23330", "Descri\u00e7\u00e3o da Conta": "Transportes"}, {"Cod": "23331", "Descri\u00e7\u00e3o da Conta": "Servi\u00e7os terceirizados de transporte de funcion\u00e1rios"}, {"Cod": "23340", "Descri\u00e7\u00e3o da Conta": "EPI's / Uniformes"}, {"Cod": "23350", "Descri\u00e7\u00e3o da Conta": "Alimenta\u00e7\u00e3o"}, {"Cod": "23400", "Descri\u00e7\u00e3o da Conta": "Alugueis"}, {"Cod": "23500", "Descri\u00e7\u00e3o da Conta": "Financeiras"}, {"Cod": "23600", "Descri\u00e7\u00e3o da Conta": "Sistemas"}, {"Cod": "24000", "Descri\u00e7\u00e3o da Conta": "Produ\u00e7\u00e3o"}, {"Cod": "24100", "Descri\u00e7\u00e3o da Conta": "Custos de Materiais Diretos"}, {"Cod": "24110", "Descri\u00e7\u00e3o da Conta": "Insumos de Produ\u00e7\u00e3o"}, {"Cod": "24120", "Descri\u00e7\u00e3o da Conta": "Embalagens"}, {"Cod": "24200", "Descri\u00e7\u00e3o da Conta": "Despesas Prorata"}, {"Cod": "24210", "Descri\u00e7\u00e3o da Conta": "Contas (parcela das despesas de energia na administra\u00e7\u00e3o)"}, {"Cod": "24300", "Descri\u00e7\u00e3o da Conta": "Perdas"}, {"Cod": "24400", "Descri\u00e7\u00e3o da Conta": "Despesas diretas sobre vendas (impostos, tributos.etc.)"}, {"Cod": "25000", "Descri\u00e7\u00e3o da Conta": "Estoques (Imobilizado)"}, {"Cod": "25100", "Descri\u00e7\u00e3o da Conta": "Estoque Padaria"}, {"Cod": "25200", "Descri\u00e7\u00e3o da Conta": "Estoque Mercado (prateleiras)"}, {"Cod": "25300", "Descri\u00e7\u00e3o da Conta": "Fretes (das compras)"}, {"Cod": "25400", "Descri\u00e7\u00e3o da Conta": "Estoque Cozinha"}, {"Cod": "26000", "Descri\u00e7\u00e3o da Conta": "Despesas Gestores"}, {"Cod": "26100", "Descri\u00e7\u00e3o da Conta": "Retiradas"}, {"Cod": "26200", "Descri\u00e7\u00e3o da Conta": "Treinamentos"}, {"Cod": "26300", "Descri\u00e7\u00e3o da Conta": "Dependentes"}, {"Cod": "26400", "Descri\u00e7\u00e3o da Conta": "Prolabore"}, {"Cod": "26500", "Descri\u00e7\u00e3o da Conta": "Outros"}, {"Cod": "27000", "Descri\u00e7\u00e3o da Conta": "Despesas Comerciais"}, {"Cod": "27100", "Descri\u00e7\u00e3o da Conta": "Impostos"}, {"Cod": "27200", "Descri\u00e7\u00e3o da Conta": "Publicidade & Propaganda"}, {"Cod": "27300", "Descri\u00e7\u00e3o da Conta": "Descontos"}, {"Cod": "27400", "Descri\u00e7\u00e3o da Conta": "Devolu\u00e7\u00f5es"}, {"Cod": "10000", "Descri\u00e7\u00e3o da Conta": "Receitas"}, {"Cod": "11000", "Descri\u00e7\u00e3o da Conta": "Venda de Produtos de Revenda"}, {"Cod": "12000", "Descri\u00e7\u00e3o da Conta": "Venda de Produtos Manufaturados"}, {"Cod": "12100", "Descri\u00e7\u00e3o da Conta": "Venda Produtos Padaria"}, {"Cod": "12200", "Descri\u00e7\u00e3o da Conta": "Venda Produtos Lanchonete"}, {"Cod": "12300", "Descri\u00e7\u00e3o da Conta": "Venda de Cestas/Coffee Break/etc"}, {"Cod": "12400", "Descri\u00e7\u00e3o da Conta": "Venda de Salgados e P\u00e3o de queijo congelados"}, {"Cod": "13000", "Descri\u00e7\u00e3o da Conta": "Outras Receitas"}]

print("Limpando tabela...")
PlanoContas.objects.all().delete()

count = 0
for row in data:
    cod = row['Cod']
    desc = row['Descrição da Conta']
    
    if not cod or not desc or str(cod).lower() == 'nan' or str(desc).lower() == 'nan':
        continue
        
    cod = str(cod).strip()
    
    if cod.startswith('1'):
        natureza = TipoNatureza.RECEITA
    else:
        natureza = TipoNatureza.DESPESA
        
    stripped = cod.rstrip('0')
    nivel = len(stripped) if len(stripped) > 0 else 1
    
    # We shouldn't truncate or just take 5 digits, let's keep all characters but dot separated
    # if it's 21131 -> 2.1.1.3.1. If it's 211311 -> 2.1.1.3.1.1
    # We don't ljust to 5 if it's longer.
    cod_padded = cod.ljust(5, '0')
    codigo_formatado = '.'.join(list(cod_padded))
    
    obj, created = PlanoContas.objects.get_or_create(
        codigo=codigo_formatado,
        defaults={
            'descricao': desc.strip(),
            'tipo_natureza': natureza,
            'nivel': nivel,
            'ativo': True
        }
    )
    if not created:
        # If it already exists, it means the Excel has duplicate codes or formatting causes duplicate.
        # Let's append an extra digit or just update it if we want the last desc.
        pass
    else:
        count += 1
    
print(f"Importados {count} registros com sucesso!")
