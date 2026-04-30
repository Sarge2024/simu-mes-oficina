"""
Veículos — Cadastro de Marcas, Modelos e Ativos.

Tabelas: Veic_Marca, Veic_Modelo, Veic_Ativo.
"""

from django.db import models


# ──────────────────────────────────────────
# Veic_Motor
# ──────────────────────────────────────────
class Motor(models.Model):
    """Família e especificações técnicas do motor."""

    codigo_familia = models.CharField("Código da Família", max_length=50, help_text="Ex: FIASA, SEVEL, AP, FIRE")
    cilindradas = models.CharField("Cilindradas", max_length=20, help_text="Ex: 1.0, 1.6, 2.0")
    valvulas = models.CharField("Válvulas", max_length=10, help_text="Ex: 8V, 16V")
    ativo = models.BooleanField("Ativo", default=True)
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)

    class Meta:
        db_table = "veic_motor"
        verbose_name = "Motor"
        verbose_name_plural = "Motores"
        ordering = ["codigo_familia", "cilindradas"]
        constraints = [
            models.UniqueConstraint(
                fields=["codigo_familia", "cilindradas", "valvulas"],
                name="uq_veic_motor_familia_cilindradas_valvulas",
            )
        ]

    def __str__(self):
        return f"{self.codigo_familia} {self.cilindradas} {self.valvulas}"


# ──────────────────────────────────────────
# Veic_Marca
# ──────────────────────────────────────────
class Marca(models.Model):
    """Marca do veículo (ex: Toyota, Honda, VW)."""

    nome_marca = models.CharField("Nome da Marca", max_length=100, unique=True)
    ativo = models.BooleanField("Ativo", default=True)
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)

    class Meta:
        db_table = "veic_marca"
        verbose_name = "Marca"
        verbose_name_plural = "Marcas"
        ordering = ["nome_marca"]

    def __str__(self):
        return self.nome_marca


# ──────────────────────────────────────────
# Veic_Modelo
# ──────────────────────────────────────────
class CategoriaVeiculo(models.TextChoices):
    CARRO = "carro", "Carro"
    MOTO = "moto", "Moto"
    CAMINHAO = "caminhao", "Caminhão"
    ONIBUS = "onibus", "Ônibus"
    UTILITARIO = "utilitario", "Utilitário"
    OUTRO = "outro", "Outro"


class Modelo(models.Model):
    """Modelo do veículo vinculado a uma marca."""

    nome_modelo = models.CharField("Nome do Modelo", max_length=150)
    marca = models.ForeignKey(
        Marca,
        on_delete=models.PROTECT,
        related_name="modelos",
        verbose_name="Marca",
    )
    categoria_veiculo = models.CharField(
        "Categoria do Veículo",
        max_length=20,
        choices=CategoriaVeiculo.choices,
        default=CategoriaVeiculo.CARRO,
    )
    ativo = models.BooleanField("Ativo", default=True)
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)

    class Meta:
        db_table = "veic_modelo"
        verbose_name = "Modelo"
        verbose_name_plural = "Modelos"
        ordering = ["marca__nome_marca", "nome_modelo"]
        constraints = [
            models.UniqueConstraint(
                fields=["marca", "nome_modelo"],
                name="uq_veic_modelo_marca_nome",
            )
        ]

    def __str__(self):
        return f"{self.marca.nome_marca} {self.nome_modelo}"


# ──────────────────────────────────────────
# Veic_Versao (Novo - Integração FIPE)
# ──────────────────────────────────────────
class TipoCombustivel(models.TextChoices):
    GASOLINA = "G", "Gasolina"
    ALCOOL = "A", "Álcool"
    FLEX = "F", "Flex"
    DIESEL = "D", "Diesel"
    ELETRICO = "E", "Elétrico"
    HIBRIDO = "H", "Híbrido"

class Versao(models.Model):
    """Versão específica de um modelo (Catálogo FIPE)."""

    modelo = models.ForeignKey(
        Modelo,
        on_delete=models.CASCADE,
        related_name="versoes",
        verbose_name="Modelo",
    )
    nome_versao = models.CharField("Nome da Versão/Motorização", max_length=150)
    codigo_fipe = models.CharField("Código FIPE", max_length=20, unique=True, null=True, blank=True)
    motor = models.ForeignKey(
        Motor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="versoes",
        verbose_name="Motor Técnico",
    )
    motorizacao = models.CharField("Motorização (Texto)", max_length=50, blank=True, default="")
    combustivel = models.CharField(
        "Combustível",
        max_length=1,
        choices=TipoCombustivel.choices,
        default=TipoCombustivel.FLEX,
    )
    ativo = models.BooleanField("Ativo", default=True)
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)

    class Meta:
        db_table = "veic_versao"
        verbose_name = "Versão"
        verbose_name_plural = "Versões"
        ordering = ["modelo__nome_modelo", "nome_versao"]

    def __str__(self):
        return f"{self.modelo} {self.nome_versao}"


# ──────────────────────────────────────────
# Veic_Cotacao_Mercado (Novo - Integração FIPE)
# ──────────────────────────────────────────
class CotacaoMercado(models.Model):
    """Histórico de avaliações de mercado (FIPE) por versão e ano."""
    
    versao = models.ForeignKey(
        Versao,
        on_delete=models.CASCADE,
        related_name="cotacoes",
        verbose_name="Versão",
    )
    ano_referencia = models.PositiveSmallIntegerField("Ano de Referência")
    valor = models.DecimalField("Valor de Mercado (R$)", max_digits=12, decimal_places=2)
    mes_referencia = models.PositiveSmallIntegerField("Mês de Referência", null=True, blank=True)
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)

    class Meta:
        db_table = "veic_cotacao_mercado"
        verbose_name = "Cotação de Mercado"
        verbose_name_plural = "Cotações de Mercado"
        ordering = ["-ano_referencia", "versao"]
        constraints = [
            models.UniqueConstraint(
                fields=["versao", "ano_referencia", "mes_referencia"],
                name="uq_veic_cotacao_versao_ano_mes",
            )
        ]

    def __str__(self):
        return f"{self.versao} ({self.ano_referencia}) - R$ {self.valor}"


# ──────────────────────────────────────────
# Veic_Ativo
# ──────────────────────────────────────────
class Ativo(models.Model):
    """Veículo cadastrado de um cliente."""

    placa = models.CharField("Placa", max_length=10, unique=True)
    chassi = models.CharField("Chassi", max_length=17, unique=True)
    cliente = models.ForeignKey(
        "core.Cliente",
        on_delete=models.PROTECT,
        related_name="veiculos",
        verbose_name="Cliente",
    )
    versao = models.ForeignKey(
        Versao,
        on_delete=models.PROTECT,
        related_name="ativos",
        verbose_name="Versão",
    )
    ano_fabricacao = models.PositiveSmallIntegerField(
        "Ano de Fabricação", null=True, blank=True
    )
    cor = models.CharField("Cor", max_length=50, blank=True, default="")
    km = models.PositiveIntegerField("Quilometragem", default=0)
    ativo = models.BooleanField("Ativo", default=True)
    criado_em = models.DateTimeField("Criado em", auto_now_add=True)
    atualizado_em = models.DateTimeField("Atualizado em", auto_now=True)

    class Meta:
        db_table = "veic_ativo"
        verbose_name = "Veículo (Ativo)"
        verbose_name_plural = "Veículos (Ativos)"
        ordering = ["placa"]

    def __str__(self):
        return f"{self.placa} — {self.versao}"
