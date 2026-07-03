"""
Core — Cadastros Fundamentais (Master Data).

Tabelas: Core_EmpresaFilial, Core_Cliente, Core_Fornecedor, Core_Colaborador.
"""

from django.db import models


# ──────────────────────────────────────────
# Core_EmpresaFilial
# ──────────────────────────────────────────
class TipoEmpresa(models.TextChoices):
    CLIENTE = "cliente", "Cliente"
    FORNECEDOR = "fornecedor", "Fornecedor"
    AMBOS = "ambos", "Cliente e Fornecedor"
    MATRIZ_FILIAL = "matriz_filial", "Matriz / Filial do Sistema"

class EmpresaFilial(models.Model):
    """Empresa parceira ou filial do grupo."""

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
    tipo_empresa = models.CharField(
        "Tipo de Empresa",
        max_length=20,
        choices=TipoEmpresa.choices,
        default=TipoEmpresa.MATRIZ_FILIAL,
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

class TenantModel(models.Model):
    """Modelo base para adicionar a funcionalidade multitenant (vinculado a EmpresaFilial)."""
    tenant = models.ForeignKey(
        EmpresaFilial,
        on_delete=models.CASCADE,
        related_name="%(app_label)s_%(class)s_related",
        verbose_name="Tenant (Empresa)",
        null=True,  # Initially null for migrations
    )

    class Meta:
        abstract = True


# ──────────────────────────────────────────
# Core_Cliente
# ──────────────────────────────────────────
class CategoriaContrato(models.TextChoices):
    AVULSO = "avulso", "Avulso"
    FROTA = "frota", "Frota"
    SEGURADORA = "seguradora", "Seguradora"

class TipoPessoa(models.TextChoices):
    PF = "pf", "Pessoa Física"
    PJ = "pj", "Pessoa Jurídica"

class Cliente(TenantModel):
    """Parceiro de negócios (Cliente e/ou Fornecedor)."""

    tipo_pessoa = models.CharField("Tipo de Pessoa", max_length=2, choices=TipoPessoa.choices, default=TipoPessoa.PF)
    is_cliente = models.BooleanField("É Cliente?", default=True)
    is_fornecedor = models.BooleanField("É Fornecedor?", default=False)

    nome_razao = models.CharField("Nome / Razão Social", max_length=255)
    apelido_fantasia = models.CharField("Apelido / Nome Fantasia", max_length=255, blank=True, default="")
    cpf_cnpj = models.CharField("CPF / CNPJ", max_length=18)
    telefone = models.CharField("Telefone", max_length=20, blank=True, default="")
    email = models.EmailField("E-mail", blank=True, default="")
    cep = models.CharField("CEP", max_length=10, blank=True, default="")
    endereco = models.TextField("Endereço / Logradouro", blank=True, default="")
    bairro = models.CharField("Bairro", max_length=100, blank=True, default="")
    cidade = models.CharField("Cidade", max_length=100, blank=True, default="")
    estado = models.CharField("Estado", max_length=2, blank=True, default="")
    limite_credito = models.DecimalField(
        "Limite de Crédito", max_digits=12, decimal_places=2, default=0
    )
    categoria_contrato = models.CharField(
        "Categoria de Contrato",
        max_length=20,
        choices=CategoriaContrato.choices,
        default=CategoriaContrato.AVULSO,
    )
    prazo_faturamento = models.PositiveIntegerField(
        "Prazo de Faturamento (dias)", default=30
    )
    lead_time = models.PositiveIntegerField(
        "Lead Time (dias)", default=3,
        help_text="Tempo médio de entrega em dias (se fornecedor).",
    )
    ativo = models.BooleanField("Ativo", default=True)
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)

    class Meta:
        db_table = "core_cliente"
        verbose_name = "Parceiro de Negócios"
        verbose_name_plural = "Parceiros de Negócios"
        ordering = ["nome_razao"]
        constraints = [
            models.UniqueConstraint(
                fields=["tenant", "cpf_cnpj"],
                name="uq_core_cliente_tenant_cpf_cnpj",
            )
        ]

    def __str__(self):
        return f"{self.nome_razao} ({self.cpf_cnpj})"


# ──────────────────────────────────────────
# Core_Colaborador
# ──────────────────────────────────────────
class Colaborador(TenantModel):
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


# ──────────────────────────────────────────
# Core_AuditLog
# ──────────────────────────────────────────
class AuditLogAcao(models.TextChoices):
    CRIADO = "Criado", "Criado"
    EDITADO = "Editado", "Editado"
    EXCLUIDO = "Excluído", "Excluído"
    ROLLBACK = "Rollback", "Rollback"


class AuditLog(models.Model):
    """Logs de auditoria para alterações críticas de dados."""

    usuario = models.CharField("Usuário", max_length=100, blank=True, default="Sistema")
    tabela = models.CharField("Tabela", max_length=100, db_index=True)
    registro_id = models.CharField("ID do Registro", max_length=255, db_index=True)
    acao = models.CharField("Ação", max_length=50, choices=AuditLogAcao.choices)
    detalhes = models.JSONField("Detalhes", default=dict, blank=True)
    detalhamento = models.TextField("Detalhamento das Alterações", blank=True, default="")
    timestamp = models.DateTimeField("Data/Hora", auto_now_add=True)

    class Meta:
        db_table = "core_audit_log"
        verbose_name = "Log de Auditoria"
        verbose_name_plural = "Logs de Auditoria"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["tabela", "registro_id"], name="audit_log_tbl_idx"),
        ]

    def __str__(self):
        return f"{self.timestamp} - {self.usuario} - {self.acao} em {self.tabela}"
