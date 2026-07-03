"""Societário — Movimentos de sócios vinculados a transações financeiras."""
from django.db import models
from core.models import TenantModel


class CategoriaPessoal(models.TextChoices):
    SAUDE = "saude", "Saúde"
    MORADIA = "moradia", "Moradia"
    EDUCACAO = "educacao", "Educação"
    TRANSPORTE = "transporte", "Transporte"
    ALIMENTACAO = "alimentacao", "Alimentação"
    LAZER = "lazer", "Lazer"
    INVESTIMENTO = "investimento", "Investimento"
    PROLABORE = "prolabore", "Pró-labore"
    OUTROS = "outros", "Outros"


class MovimentoSocio(TenantModel):
    transacao = models.ForeignKey("financeiro.Transacao", on_delete=models.CASCADE, related_name="movimentos_socio")
    socio = models.ForeignKey("core.Colaborador", on_delete=models.PROTECT, related_name="movimentos_societarios",
                              help_text="Colaborador com perfil de sócio.")
    categoria_pessoal = models.CharField(max_length=20, choices=CategoriaPessoal.choices, default=CategoriaPessoal.OUTROS)
    valor = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    descricao = models.TextField(blank=True, default="")
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "soc_movimento_socio"
        verbose_name = "Movimento de Sócio"
        verbose_name_plural = "Movimentos de Sócios"
        ordering = ["-criado_em"]

    def __str__(self):
        return f"Mov Sócio #{self.pk} — {self.get_categoria_pessoal_display()} R${self.valor}"
