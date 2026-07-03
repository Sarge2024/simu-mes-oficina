import os
import django
import sys

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from financeiro.models import PlanoContas, TipoNatureza

def seed_plano_contas():
    contas = [
        # RECEITAS
        ("1.0.0.0", "RECEITAS", TipoNatureza.RECEITA, 1),
        ("1.1.0.0", "Receitas Operacionais", TipoNatureza.RECEITA, 2),
        ("1.1.1.0", "Serviços de Mecânica", TipoNatureza.RECEITA, 3),
        ("1.1.2.0", "Serviços de Elétrica", TipoNatureza.RECEITA, 3),
        ("1.1.3.0", "Serviços de Funilaria", TipoNatureza.RECEITA, 3),
        ("1.1.4.0", "Venda de Peças", TipoNatureza.RECEITA, 3),

        # DESPESAS
        ("2.0.0.0", "DESPESAS", TipoNatureza.DESPESA, 1),
        ("2.1.0.0", "Despesas Operacionais (Custos Diretos)", TipoNatureza.DESPESA, 2),
        ("2.1.1.0", "Custo de Peças Aplicadas", TipoNatureza.DESPESA, 3),
        ("2.1.2.0", "Mão de Obra Direta", TipoNatureza.DESPESA, 3),
        ("2.1.3.0", "Serviços Terceirizados", TipoNatureza.DESPESA, 3),
        ("2.1.5.0", "Desvio de Orçamento (Delta OS)", TipoNatureza.DESPESA, 3),
        ("2.2.0.0", "Despesas Administrativas", TipoNatureza.DESPESA, 2),
        ("2.2.1.0", "Aluguel", TipoNatureza.DESPESA, 3),
        ("2.2.2.0", "Energia Elétrica", TipoNatureza.DESPESA, 3),
        ("2.2.3.0", "Água e Esgoto", TipoNatureza.DESPESA, 3),
        ("2.2.4.0", "Internet e Telefonia", TipoNatureza.DESPESA, 3),
        ("2.2.5.0", "Pró-Labore / Salários ADM", TipoNatureza.DESPESA, 3),
        ("2.2.6.0", "Materiais de Escritório", TipoNatureza.DESPESA, 3),
        ("2.3.0.0", "Despesas Comerciais e Vendas", TipoNatureza.DESPESA, 2),
        ("2.3.1.0", "Marketing e Publicidade", TipoNatureza.DESPESA, 3),
        ("2.3.2.0", "Comissões de Vendas", TipoNatureza.DESPESA, 3),
        ("2.4.0.0", "Despesas Financeiras", TipoNatureza.DESPESA, 2),
        ("2.4.1.0", "Tarifas Bancárias", TipoNatureza.DESPESA, 3),
        ("2.4.2.0", "Juros e Multas", TipoNatureza.DESPESA, 3),
        ("2.4.3.0", "Taxas de Cartão", TipoNatureza.DESPESA, 3),
        ("2.5.0.0", "Despesas Tributárias", TipoNatureza.DESPESA, 2),
        ("2.5.1.0", "Impostos sobre Serviços (ISS)", TipoNatureza.DESPESA, 3),
        ("2.5.2.0", "Impostos sobre Vendas (ICMS/Simples)", TipoNatureza.DESPESA, 3),

        # ATIVOS
        ("3.0.0.0", "ATIVOS", TipoNatureza.ATIVO, 1),
        ("3.1.0.0", "Ativo Circulante", TipoNatureza.ATIVO, 2),
        ("3.1.1.0", "Caixa", TipoNatureza.ATIVO, 3),
        ("3.1.2.0", "Bancos Conta Movimento", TipoNatureza.ATIVO, 3),
        ("3.1.3.0", "Contas a Receber (Clientes)", TipoNatureza.ATIVO, 3),
        ("3.1.4.0", "Estoque de Peças", TipoNatureza.ATIVO, 3),
        ("3.2.0.0", "Ativo Não Circulante (Imobilizado)", TipoNatureza.ATIVO, 2),
        ("3.2.1.0", "Máquinas e Equipamentos", TipoNatureza.ATIVO, 3),
        ("3.2.2.0", "Ferramentas", TipoNatureza.ATIVO, 3),

        # PASSIVOS
        ("4.0.0.0", "PASSIVOS", TipoNatureza.PASSIVO, 1),
        ("4.1.0.0", "Passivo Circulante", TipoNatureza.PASSIVO, 2),
        ("4.1.1.0", "Fornecedores a Pagar", TipoNatureza.PASSIVO, 3),
        ("4.1.2.0", "Salários e Encargos a Pagar", TipoNatureza.PASSIVO, 3),
        ("4.1.3.0", "Impostos a Recolher", TipoNatureza.PASSIVO, 3),
        ("4.2.0.0", "Patrimônio Líquido", TipoNatureza.PASSIVO, 2),
        ("4.2.1.0", "Capital Social", TipoNatureza.PASSIVO, 3),
    ]

    print(f"Semeando {len(contas)} contas gerenciais no plano de contas...")
    
    created_count = 0
    for codigo, descricao, natureza, nivel in contas:
        obj, created = PlanoContas.objects.get_or_create(
            codigo=codigo,
            defaults={
                'descricao': descricao,
                'tipo_natureza': natureza,
                'nivel': nivel,
                'ativo': True
            }
        )
        if created:
            created_count += 1
            
    print(f"Concluído! {created_count} contas cadastradas com sucesso.")

if __name__ == "__main__":
    seed_plano_contas()
