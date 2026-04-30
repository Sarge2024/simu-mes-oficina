"""Governança — Parâmetros globais do sistema."""
from django.db import models


class NivelParametro(models.TextChoices):
    GLOBAL = "global", "Global"
    CLIENTE = "cliente", "Por Cliente"
    FILIAL = "filial", "Por Filial"


class Parametro(models.Model):
    slug = models.SlugField("Slug", max_length=100, unique=True, help_text="Ex: LIMITE_VARIACAO_PCT")
    descricao = models.CharField("Descrição", max_length=255)
    valor_decimal = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)
    valor_texto = models.TextField(blank=True, default="")
    nivel = models.CharField(max_length=20, choices=NivelParametro.choices, default=NivelParametro.GLOBAL)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "gov_parametros"
        verbose_name = "Parâmetro de Governança"
        verbose_name_plural = "Parâmetros de Governança"
        ordering = ["slug"]

    def __str__(self):
        return f"{self.slug} = {self.valor_decimal or self.valor_texto}"
