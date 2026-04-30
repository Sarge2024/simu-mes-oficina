from django.contrib import admin
from .models import Componente, ReferenciaFabricante, AplicacaoMotor, ServicoCatalogo


@admin.register(Componente)
class ComponenteAdmin(admin.ModelAdmin):
    list_display = ("codigo_interno", "tipo_componente", "descricao_generica", "custo_medio_ponderado", "estoque_atual", "ativo")
    search_fields = ("codigo_interno", "descricao_generica")
    list_filter = ("tipo_componente", "flag_jit", "ativo")

@admin.register(ReferenciaFabricante)
class ReferenciaFabricanteAdmin(admin.ModelAdmin):
    list_display = ("codigo_fabricante", "componente", "marca", "material_construcao")
    search_fields = ("codigo_fabricante", "componente__codigo_interno", "marca__nome_marca")

@admin.register(AplicacaoMotor)
class AplicacaoMotorAdmin(admin.ModelAdmin):
    list_display = ("componente", "motor")
    search_fields = ("componente__codigo_interno", "motor__codigo_familia")


@admin.register(ServicoCatalogo)
class ServicoCatalogoAdmin(admin.ModelAdmin):
    list_display = ("codigo", "descricao", "tempo_padrao", "preco_base", "especialidade", "ativo")
    search_fields = ("codigo", "descricao")
    list_filter = ("especialidade", "ativo")
