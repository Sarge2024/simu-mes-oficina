"""
Financeiro — Plano de Contas, Títulos, Transações, Renegociação, Ciclos e Metas.
"""
from django.db import models


class TipoNatureza(models.TextChoices):
    RECEITA = "receita", "Receita"
    DESPESA = "despesa", "Despesa"
    ATIVO = "ativo", "Ativo"
    PASSIVO = "passivo", "Passivo"


class PlanoContas(models.Model):
    codigo = models.CharField("Código", max_length=20, unique=True, help_text="Ex: 2.1.1.1.0")
    descricao = models.CharField("Descrição", max_length=255)
    tipo_natureza = models.CharField(max_length=20, choices=TipoNatureza.choices)
    nivel = models.PositiveSmallIntegerField("Nível", default=1)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "fin_plano_contas"
        verbose_name = "Plano de Contas"
        verbose_name_plural = "Plano de Contas"
        ordering = ["codigo"]

    def __str__(self):
        return f"{self.codigo} — {self.descricao}"


class ContaBancaria(models.Model):
    """Contas de saldo (Bancos, Caixas, Cartões) para Gestão de Múltiplas Contas."""
    nome = models.CharField("Nome da Conta", max_length=100)
    tipo = models.CharField("Tipo", max_length=50, help_text="Ex: Corrente, Poupança, Caixa, Cartão")
    taxa_administrativa_pct = models.DecimalField("Taxa ADM (%)", max_digits=5, decimal_places=2, default=0)
    prazo_recebimento_dias = models.PositiveIntegerField("Prazo Recebimento (dias)", default=0)
    saldo_atual = models.DecimalField("Saldo Atual", max_digits=14, decimal_places=2, default=0)
    ativo = models.BooleanField(default=True)

    class Meta:
        db_table = "fin_conta_bancaria"
        verbose_name = "Conta Bancária"
        verbose_name_plural = "Contas Bancárias"

    def __str__(self):
        return f"{self.nome} (Saldo: R${self.saldo_atual})"


class StatusTitulo(models.TextChoices):
    ABERTO = "aberto", "Aberto"
    PARCIAL = "parcial", "Parcialmente Pago"
    PAGO = "pago", "Pago"
    RENEGOCIADO = "renegociado", "Renegociado"
    CANCELADO = "cancelado", "Cancelado"


class Titulo(models.Model):
    os = models.ForeignKey("operacional.OrdemServico", on_delete=models.PROTECT, related_name="titulos")
    cliente = models.ForeignKey("core.Cliente", on_delete=models.PROTECT, related_name="titulos")
    valor_original = models.DecimalField(max_digits=14, decimal_places=2)
    valor_atualizado = models.DecimalField(max_digits=14, decimal_places=2)
    vencimento = models.DateField()
    data_competencia = models.DateField()
    status = models.CharField(max_length=20, choices=StatusTitulo.choices, default=StatusTitulo.ABERTO)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "fin_titulo"
        verbose_name = "Título Financeiro"
        verbose_name_plural = "Títulos Financeiros"
        ordering = ["vencimento"]

    def __str__(self):
        return f"Título #{self.pk} — R${self.valor_atualizado} [{self.get_status_display()}]"


class Transacao(models.Model):
    titulo = models.ForeignKey(Titulo, on_delete=models.CASCADE, related_name="transacoes")
    plano_contas = models.ForeignKey(PlanoContas, on_delete=models.PROTECT, related_name="transacoes")
    conta_bancaria = models.ForeignKey(ContaBancaria, on_delete=models.PROTECT, related_name="transacoes", null=True, blank=True)
    valor_pago = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    juros = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    multa = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    data_caixa = models.DateField()
    delta_variacao_os = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Desvio lançado automaticamente na conta 2.1.5.0.0.",
    )
    observacoes = models.TextField(blank=True, default="")
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "fin_transacao"
        verbose_name = "Transação Financeira"
        verbose_name_plural = "Transações Financeiras"
        ordering = ["-data_caixa"]

    def __str__(self):
        return f"Tx #{self.pk} — R${self.valor_pago} ({self.data_caixa})"


class Renegociacao(models.Model):
    titulo_antigo = models.ForeignKey(Titulo, on_delete=models.PROTECT, related_name="renegociacoes_origem")
    titulo_novo = models.ForeignKey(Titulo, on_delete=models.PROTECT, related_name="renegociacoes_destino")
    valor_acrescimo = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    motivo = models.TextField(blank=True, default="")
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "fin_renegociacao"
        verbose_name = "Renegociação"
        verbose_name_plural = "Renegociações"
        ordering = ["-criado_em"]

    def __str__(self):
        return f"Renego #{self.pk}: Título #{self.titulo_antigo_id} → #{self.titulo_novo_id}"


class StatusCiclo(models.TextChoices):
    PLANEJAMENTO = "planejamento", "Em Planejamento"
    ATIVO = "ativo", "Ativo"
    ENCERRADO = "encerrado", "Encerrado"


class CicloOrcamento(models.Model):
    ano = models.PositiveSmallIntegerField("Ano")
    quadrimestre = models.PositiveSmallIntegerField("Quadrimestre", help_text="1, 2 ou 3")
    status = models.CharField(max_length=20, choices=StatusCiclo.choices, default=StatusCiclo.PLANEJAMENTO)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "fin_ciclo_orcamento"
        verbose_name = "Ciclo Orçamentário"
        verbose_name_plural = "Ciclos Orçamentários"
        constraints = [
            models.UniqueConstraint(fields=["ano", "quadrimestre"], name="uq_fin_ciclo_ano_quad")
        ]

    def __str__(self):
        return f"{self.ano} Q{self.quadrimestre}"


class MetaConta(models.Model):
    ciclo = models.ForeignKey(CicloOrcamento, on_delete=models.CASCADE, related_name="metas")
    plano_contas = models.ForeignKey(PlanoContas, on_delete=models.PROTECT, related_name="metas")
    meta_valor = models.DecimalField("Meta R$", max_digits=14, decimal_places=2, default=0)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "fin_meta_conta"
        verbose_name = "Meta por Conta"
        verbose_name_plural = "Metas por Conta"
        constraints = [
            models.UniqueConstraint(fields=["ciclo", "plano_contas"], name="uq_fin_meta_ciclo_conta")
        ]

    def __str__(self):
        return f"Meta {self.plano_contas.codigo} — {self.ciclo}"
