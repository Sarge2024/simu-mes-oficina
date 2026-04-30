"""
Catálogo — Produtos (Peças) e Serviços (Mão de Obra).

Tabelas: Prod_Catalogo, Serv_Catalogo.
"""

from django.db import models


# ──────────────────────────────────────────
class TipoComponente(models.TextChoices):
    RETENTOR = "RETENTOR", "Retentor"
    JUNTA = "JUNTA", "Junta"
    FILTRO = "FILTRO", "Filtro"
    CORREIA = "CORREIA", "Correia"
    OLEO = "OLEO", "Óleo"
    OUTRO = "OUTRO", "Outro"

class Componente(models.Model):
    """Catálogo genérico de peças (O Cadastro Mestre da Oficina)."""

    codigo_interno = models.CharField("Código Interno", max_length=50, unique=True, help_text="Ex: RET-VAL-001 (SKU central)")
    tipo_componente = models.CharField(
        "Tipo de Componente", max_length=50, choices=TipoComponente.choices, default=TipoComponente.OUTRO
    )
    descricao_generica = models.CharField("Descrição Genérica", max_length=255, help_text="Ex: Retentor Haste de válvula")
    medidas_tecnicas = models.CharField("Medidas Técnicas", max_length=100, blank=True, default="", help_text="Ex: 8,00x10,90x10,00")
    
    unidade = models.CharField(
        "Unidade", max_length=10, default="UN",
        help_text="Ex: UN, LT, KG, MT.",
    )
    custo_medio_ponderado = models.DecimalField(
        "Custo Médio Ponderado (R$)", max_digits=12, decimal_places=2, default=0,
        help_text="Atualizado automaticamente pela entrada de NFe."
    )
    preco_venda = models.DecimalField(
        "Preço de Venda (R$)", max_digits=12, decimal_places=2, default=0
    )
    ponto_pedido = models.PositiveIntegerField(
        "Ponto de Pedido", default=0,
        help_text="Qtd mínima para gerar alerta de reposição.",
    )
    estoque_atual = models.PositiveIntegerField("Estoque Atual", default=0)
    flag_jit = models.BooleanField(
        "Just-In-Time",
        default=False,
        help_text="Se True, peça é comprada sob demanda (sem estoque).",
    )
    ativo = models.BooleanField("Ativo", default=True)
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)

    class Meta:
        db_table = "prod_componente"
        verbose_name = "Componente"
        verbose_name_plural = "Componentes"
        ordering = ["descricao_generica"]

    def __str__(self):
        return f"[{self.codigo_interno}] {self.descricao_generica}"


class ReferenciaFabricante(models.Model):
    """A Tabela de Equivalências (Peça de um fabricante específico)."""
    
    componente = models.ForeignKey(Componente, on_delete=models.CASCADE, related_name="referencias", verbose_name="Componente Genérico")
    marca = models.ForeignKey("veiculos.Marca", on_delete=models.PROTECT, related_name="referencias_produtos", verbose_name="Marca/Fabricante")
    codigo_fabricante = models.CharField("Código do Fabricante", max_length=100, help_text="Código impresso na caixa/catálogo.")
    material_construcao = models.CharField("Material de Construção", max_length=100, blank=True, default="", help_text="Ex: NBR, MVQ")
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "prod_referencia_fabricante"
        verbose_name = "Referência de Fabricante"
        verbose_name_plural = "Referências de Fabricantes"
        constraints = [
            models.UniqueConstraint(
                fields=["marca", "codigo_fabricante"],
                name="uq_prod_referencia_marca_codigo",
            )
        ]

    def __str__(self):
        return f"{self.marca.nome_marca} - {self.codigo_fabricante} ({self.componente.codigo_interno})"


class AplicacaoMotor(models.Model):
    """Aplicação Técnica (Componente ↔ Motor)."""
    
    componente = models.ForeignKey(Componente, on_delete=models.CASCADE, related_name="aplicacoes_motor", verbose_name="Componente")
    motor = models.ForeignKey("veiculos.Motor", on_delete=models.CASCADE, related_name="aplicacoes_componentes", verbose_name="Motor")
    observacoes = models.TextField("Observações", blank=True, default="", help_text="Ex: Apenas modelos à gasolina.")
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "prod_aplicacao_motor"
        verbose_name = "Aplicação de Motor"
        verbose_name_plural = "Aplicações de Motores"
        constraints = [
            models.UniqueConstraint(
                fields=["componente", "motor"],
                name="uq_prod_aplicacao_componente_motor",
            )
        ]

    def __str__(self):
        return f"{self.componente.codigo_interno} ➔ {self.motor}"


# ──────────────────────────────────────────
# Serv_Catalogo
# ──────────────────────────────────────────
class ServicoCatalogo(models.Model):
    """Catálogo de serviços / mão de obra."""

    codigo = models.CharField("Código", max_length=50, unique=True)
    descricao = models.CharField("Descrição", max_length=255)
    tempo_padrao = models.DecimalField(
        "Tempo Padrão (h)", max_digits=6, decimal_places=2, default=1,
        help_text="Tempo padrão em horas para executar o serviço.",
    )
    preco_base = models.DecimalField(
        "Preço Base (R$)", max_digits=12, decimal_places=2, default=0
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
        db_table = "serv_catalogo"
        verbose_name = "Serviço (Catálogo)"
        verbose_name_plural = "Serviços (Catálogo)"
        ordering = ["descricao"]

    def __str__(self):
        return f"[{self.codigo}] {self.descricao}"
