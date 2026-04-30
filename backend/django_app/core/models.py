"""
Core — Cadastros Fundamentais (Master Data).

Tabelas: Core_EmpresaFilial, Core_Cliente, Core_Fornecedor, Core_Colaborador.
"""

from django.db import models


# ──────────────────────────────────────────
# Core_EmpresaFilial
# ──────────────────────────────────────────
class EmpresaFilial(models.Model):
    """Empresa ou filial do grupo."""

    razao_social = models.CharField("Razão Social", max_length=255)
    cnpj = models.CharField("CNPJ", max_length=18, unique=True)
    inscricao_estadual = models.CharField(
        "Inscrição Estadual", max_length=20, blank=True, default=""
    )
    endereco = models.TextField("Endereço", blank=True, default="")
    telefone = models.CharField("Telefone", max_length=20, blank=True, default="")
    email = models.EmailField("E-mail", blank=True, default="")
    configuracoes = models.JSONField(
        "Configurações",
        default=dict,
        blank=True,
        help_text="Parâmetros específicos da filial (JSON).",
    )
    ativo = models.BooleanField("Ativo", default=True)
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)

    class Meta:
        db_table = "core_empresa_filial"
        verbose_name = "Empresa / Filial"
        verbose_name_plural = "Empresas / Filiais"
        ordering = ["razao_social"]

    def __str__(self):
        return f"{self.razao_social} ({self.cnpj})"


# ──────────────────────────────────────────
# Core_Cliente
# ──────────────────────────────────────────
class CategoriaContrato(models.TextChoices):
    AVULSO = "avulso", "Avulso"
    CONTRATO = "contrato", "Contrato"
    FROTISTA = "frotista", "Frotista"


class Cliente(models.Model):
    """Cliente da oficina (PF ou PJ)."""

    nome_razao = models.CharField("Nome / Razão Social", max_length=255)
    cpf_cnpj = models.CharField("CPF / CNPJ", max_length=18, unique=True)
    telefone = models.CharField("Telefone", max_length=20, blank=True, default="")
    email = models.EmailField("E-mail", blank=True, default="")
    endereco = models.TextField("Endereço", blank=True, default="")
    limite_credito = models.DecimalField(
        "Limite de Crédito", max_digits=12, decimal_places=2, default=0
    )
    categoria_contrato = models.CharField(
        "Categoria de Contrato",
        max_length=20,
        choices=CategoriaContrato.choices,
        default=CategoriaContrato.AVULSO,
    )
    ativo = models.BooleanField("Ativo", default=True)
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)

    class Meta:
        db_table = "core_cliente"
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"
        ordering = ["nome_razao"]

    def __str__(self):
        return f"{self.nome_razao} ({self.cpf_cnpj})"


# ──────────────────────────────────────────
# Core_Fornecedor
# ──────────────────────────────────────────
class Fornecedor(models.Model):
    """Fornecedor de peças e insumos."""

    razao_social = models.CharField("Razão Social", max_length=255)
    cnpj = models.CharField("CNPJ", max_length=18, unique=True)
    telefone = models.CharField("Telefone", max_length=20, blank=True, default="")
    email = models.EmailField("E-mail", blank=True, default="")
    prazo_faturamento = models.PositiveIntegerField(
        "Prazo de Faturamento (dias)", default=30
    )
    lead_time = models.PositiveIntegerField(
        "Lead Time (dias)", default=3,
        help_text="Tempo médio de entrega em dias.",
    )
    ativo = models.BooleanField("Ativo", default=True)
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)

    class Meta:
        db_table = "core_fornecedor"
        verbose_name = "Fornecedor"
        verbose_name_plural = "Fornecedores"
        ordering = ["razao_social"]

    def __str__(self):
        return self.razao_social


# ──────────────────────────────────────────
# Core_Colaborador
# ──────────────────────────────────────────
class Colaborador(models.Model):
    """Colaborador interno (mecânico, eletricista, etc.)."""

    nome = models.CharField("Nome", max_length=255)
    cargo = models.CharField("Cargo", max_length=100, blank=True, default="")
    custo_hora = models.DecimalField(
        "Custo Hora (R$)", max_digits=10, decimal_places=2, default=0
    )
    especialidade = models.CharField(
        "Especialidade",
        max_length=100,
        blank=True,
        default="",
        help_text="Ex: Motor, Elétrica, Funilaria.",
    )
    ativo = models.BooleanField("Ativo", default=True)
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)

    class Meta:
        db_table = "core_colaborador"
        verbose_name = "Colaborador"
        verbose_name_plural = "Colaboradores"
        ordering = ["nome"]

    def __str__(self):
        return f"{self.nome} — {self.especialidade or self.cargo}"
