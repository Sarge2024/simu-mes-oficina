from django.contrib import admin
from .models import Requisicao, ItemRequisicao, PedidoCompra


class ItemRequisicaoInline(admin.TabularInline):
    model = ItemRequisicao
    extra = 0
    raw_id_fields = ("produto", "fornecedor")


@admin.register(Requisicao)
class RequisicaoAdmin(admin.ModelAdmin):
    list_display = ("id", "os", "tipo", "status", "criado_em")
    list_filter = ("tipo", "status")
    raw_id_fields = ("os",)
    inlines = [ItemRequisicaoInline]


@admin.register(PedidoCompra)
class PedidoCompraAdmin(admin.ModelAdmin):
    list_display = ("id", "fornecedor", "status", "data_emissao", "valor_total_estimado")
    list_filter = ("status",)
    raw_id_fields = ("fornecedor",)
