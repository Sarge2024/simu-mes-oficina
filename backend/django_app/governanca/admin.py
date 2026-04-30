from django.contrib import admin
from .models import Parametro


@admin.register(Parametro)
class ParametroAdmin(admin.ModelAdmin):
    list_display = ("slug", "valor_decimal", "nivel", "ativo")
    search_fields = ("slug", "descricao")
    list_filter = ("nivel", "ativo")
