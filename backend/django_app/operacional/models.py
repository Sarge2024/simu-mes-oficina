"""
Operacional — Ordens de Serviço, Orçamentos e Histórico de Aprovação.

Tabelas: Op_OrdemServico, Op_Orcamento, Op_OrcamentoItem, Op_HistoricoAprovacao.
"""

from django.conf import settings
from django.db import models


# ──────────────────────────────────────────
# Op_OrdemServico
# ──────────────────────────────────────────
class StatusOS(models.TextChoices):
    EM_DIAGNOSTICO = "em_diagnostico", "Em Diagnóstico"
    AGUARDANDO_APROVACAO = "aguardando_aprovacao", "Aguardando Aprovação"
    EM_EXECUCAO = "em_execucao", "Em Execução"
    AGUARDANDO_PECAS = "aguardando_pecas", "Aguardando Peças"
    CONCLUIDA = "concluida", "Concluída"
    ENTREGUE = "entregue", "Entregue"
    CANCELADA = "cancelada", "Cancelada"


class OrdemServico(models.Model):
    """Ordem de Serviço da oficina."""

    veiculo = models.ForeignKey(
        "veiculos.Ativo",
        on_delete=models.PROTECT,
        related_name="ordens_servico",
        verbose_name="Veículo",
    )
    status = models.CharField(
        "Status",
        max_length=30,
        choices=StatusOS.choices,
        default=StatusOS.EM_DIAGNOSTICO,
    )
    descricao_problema = models.TextField(
        "Descrição do Problema", blank=True, default=""
    )
    km_entrada = models.PositiveIntegerField("KM na Entrada", default=0)
    data_in = models.DateTimeField("Data de Entrada", auto_now_add=True)
    data_out = models.DateTimeField("Data de Saída", null=True, blank=True)
    observacoes = models.TextField("Observações", blank=True, default="")
    tempo_real_minutos = models.PositiveIntegerField("Tempo Real (min)", default=0, help_text="Feedback de execução (RF-OP-10)")
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)

    class Meta:
        db_table = "op_ordem_servico"
        verbose_name = "Ordem de Serviço"
        verbose_name_plural = "Ordens de Serviço"
        ordering = ["-data_in"]

    def __str__(self):
        return f"OS #{self.pk} — {self.veiculo.placa} [{self.get_status_display()}]"


# ──────────────────────────────────────────
# Op_Orcamento
# ──────────────────────────────────────────
class StatusAprovacao(models.TextChoices):
    RASCUNHO = "rascunho", "Rascunho"
    ENVIADO = "enviado", "Enviado ao Cliente"
    APROVADO = "aprovado", "Aprovado"
    REJEITADO = "rejeitado", "Rejeitado"


class Orcamento(models.Model):
    """
    Orçamento vinculado a uma OS.
    Suporta versionamento: V1.0 (inicial), V1.1 (aditivo), etc.
    """

    os = models.ForeignKey(
        OrdemServico,
        on_delete=models.CASCADE,
        related_name="orcamentos",
        verbose_name="Ordem de Serviço",
    )
    versao = models.PositiveSmallIntegerField("Versão", default=1)
    is_active = models.BooleanField(
        "Versão Ativa",
        default=True,
        help_text="Apenas uma versão deve estar ativa por OS.",
    )
    status_aprovacao = models.CharField(
        "Status de Aprovação",
        max_length=20,
        choices=StatusAprovacao.choices,
        default=StatusAprovacao.RASCUNHO,
    )
    valor_total = models.DecimalField(
        "Valor Total (R$)", max_digits=14, decimal_places=2, default=0
    )
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)

    class Meta:
        db_table = "op_orcamento"
        verbose_name = "Orçamento"
        verbose_name_plural = "Orçamentos"
        ordering = ["os", "versao"]
        constraints = [
            models.UniqueConstraint(
                fields=["os", "versao"],
                name="uq_op_orcamento_os_versao",
            )
        ]

    def __str__(self):
        return f"Orçamento OS#{self.os_id} v{self.versao}"


# ──────────────────────────────────────────
# Op_OrcamentoItem
# ──────────────────────────────────────────
class OrigemItem(models.TextChoices):
    INICIAL = "inicial", "Inicial"
    EXTRA = "extra", "Extra (Aditivo)"


class OrcamentoItem(models.Model):
    """
    Item de um orçamento — referencia peça OU serviço.
    Quando Valor_Real é preenchido, o trigger deve calcular Delta_Variacao_OS.
    """

    orcamento = models.ForeignKey(
        Orcamento,
        on_delete=models.CASCADE,
        related_name="itens",
        verbose_name="Orçamento",
    )
    produto = models.ForeignKey(
        "catalogo.Componente",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="orcamento_itens",
        verbose_name="Produto (Peça)",
    )
    servico = models.ForeignKey(
        "catalogo.ServicoCatalogo",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="orcamento_itens",
        verbose_name="Serviço (MO)",
    )
    origem = models.CharField(
        "Origem",
        max_length=10,
        choices=OrigemItem.choices,
        default=OrigemItem.INICIAL,
    )
    quantidade = models.DecimalField(
        "Quantidade", max_digits=10, decimal_places=2, default=1
    )
    valor_estimado = models.DecimalField(
        "Valor Estimado (R$)", max_digits=12, decimal_places=2, default=0
    )
    is_terceiro = models.BooleanField("É Serviço Terceirizado?", default=False)
    fornecedor = models.ForeignKey(
        "core.Fornecedor",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="servicos_terceirizados",
        verbose_name="Fornecedor (Terceiro)",
    )
    lead_time_previsto_dias = models.PositiveIntegerField("Lead Time Previsto (dias)", default=0)
    valor_real = models.DecimalField(
        "Valor Real (R$)", max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="Preenchido após execução. Trigger calcula Delta_Variacao_OS.",
    )
    delta_variacao_os = models.DecimalField(
        "Delta Variação OS (R$)",
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Desvio = Valor_Real - Valor_Estimado. Lançado na conta 2.1.5.0.0.",
    )
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)

    class Meta:
        db_table = "op_orcamento_item"
        verbose_name = "Item de Orçamento"
        verbose_name_plural = "Itens de Orçamento"

    def save(self, *args, **kwargs):
        """
        Trigger de Roteamento (GDI §1):
        Calcula Delta_Variacao_OS automaticamente quando Valor_Real é preenchido.
        O desvio será lançado na conta 2.1.5.0.0 pelo serviço financeiro.
        """
        if self.valor_real is not None:
            self.delta_variacao_os = self.valor_real - self.valor_estimado
        super().save(*args, **kwargs)

    def __str__(self):
        ref = self.produto or self.servico or "—"
        return f"Item #{self.pk}: {ref} ({self.get_origem_display()})"


# ──────────────────────────────────────────
# Op_HistoricoAprovacao
# ──────────────────────────────────────────
class HistoricoAprovacao(models.Model):
    """Registra cada evento de bloqueio/aprovação de OS."""

    os = models.ForeignKey(
        OrdemServico,
        on_delete=models.CASCADE,
        related_name="historico_aprovacao",
        verbose_name="Ordem de Serviço",
    )
    usuario_aprovador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="aprovacoes",
        verbose_name="Aprovador",
    )
    valor_antes = models.DecimalField(
        "Valor Antes (R$)", max_digits=14, decimal_places=2, default=0
    )
    valor_aditivo = models.DecimalField(
        "Valor do Aditivo (R$)", max_digits=14, decimal_places=2, default=0
    )
    justificativa = models.TextField("Justificativa", blank=True, default="")
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)

    class Meta:
        db_table = "op_historico_aprovacao"
        verbose_name = "Histórico de Aprovação"
        verbose_name_plural = "Históricos de Aprovação"
        ordering = ["-criado_em"]

    def __str__(self):
        return f"Aprovação OS#{self.os_id} em {self.criado_em:%d/%m/%Y}"


# ──────────────────────────────────────────
# Op_RecursoFisico e Op_Alocacao (Agenda)
# ──────────────────────────────────────────
class RecursoFisico(models.Model):
    """Estruturas físicas (ex: Box, Rampa) para alocação."""
    nome = models.CharField("Nome do Recurso", max_length=100)
    tipo = models.CharField("Tipo", max_length=50, help_text="Ex: Box, Rampa, Elevador")
    ativo = models.BooleanField("Ativo", default=True)

    class Meta:
        db_table = "op_recurso_fisico"
        verbose_name = "Recurso Físico"
        verbose_name_plural = "Recursos Físicos"

    def __str__(self):
        return f"{self.tipo}: {self.nome}"

class Alocacao(models.Model):
    """Alocação de uma OS em um Recurso (Box) e/ou Colaborador na Agenda."""
    os = models.ForeignKey(OrdemServico, on_delete=models.CASCADE, related_name="alocacoes")
    recurso = models.ForeignKey(RecursoFisico, on_delete=models.SET_NULL, null=True, blank=True, related_name="alocacoes")
    colaborador = models.ForeignKey("core.Colaborador", on_delete=models.SET_NULL, null=True, blank=True, related_name="alocacoes")
    data_inicio = models.DateTimeField("Data/Hora Início")
    data_fim = models.DateTimeField("Data/Hora Fim")
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "op_alocacao"
        verbose_name = "Alocação"
        verbose_name_plural = "Alocações"
        ordering = ["data_inicio"]

    def __str__(self):
        return f"Alocação OS#{self.os_id} ({self.data_inicio:%d/%m %H:%M} - {self.data_fim:%d/%m %H:%M})"

