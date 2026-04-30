from django.contrib import admin
from .models import Marca, Modelo, Versao, CotacaoMercado, Ativo


@admin.register(Marca)
class MarcaAdmin(admin.ModelAdmin):
    list_display = ("nome_marca", "ativo")
    search_fields = ("nome_marca",)


@admin.register(Modelo)
class ModeloAdmin(admin.ModelAdmin):
    list_display = ("nome_modelo", "marca", "categoria_veiculo", "ativo")
    list_filter = ("categoria_veiculo", "marca")
    search_fields = ("nome_modelo",)


@admin.register(Versao)
class VersaoAdmin(admin.ModelAdmin):
    list_display = ("nome_versao", "modelo", "codigo_fipe", "combustivel", "ativo")
    list_filter = ("combustivel", "ativo")
    search_fields = ("nome_versao", "codigo_fipe")
    raw_id_fields = ("modelo",)

@admin.register(CotacaoMercado)
class CotacaoMercadoAdmin(admin.ModelAdmin):
    list_display = ("versao", "ano_referencia", "valor")
    list_filter = ("ano_referencia",)
    search_fields = ("versao__nome_versao",)
    raw_id_fields = ("versao",)

@admin.register(Ativo)
class AtivoAdmin(admin.ModelAdmin):
    list_display = ("placa", "chassi", "cliente", "versao", "km", "ativo")
    search_fields = ("placa", "chassi")
    list_filter = ("ativo",)
    raw_id_fields = ("cliente", "versao")
