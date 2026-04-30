from django.contrib import admin
from .models import MovimentoSocio


@admin.register(MovimentoSocio)
class MovimentoSocioAdmin(admin.ModelAdmin):
    list_display = ("id", "socio", "categoria_pessoal", "valor", "criado_em")
    list_filter = ("categoria_pessoal",)
    raw_id_fields = ("transacao", "socio")
