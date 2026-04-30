from django.contrib import admin
from .models import PlanoContas, Titulo, Transacao, Renegociacao, CicloOrcamento, MetaConta, ContaBancaria


@admin.register(PlanoContas)
class PlanoContasAdmin(admin.ModelAdmin):
    list_display = ("codigo", "descricao", "tipo_natureza", "ativo")
    search_fields = ("codigo", "descricao")
    list_filter = ("tipo_natureza", "ativo")


@admin.register(ContaBancaria)
class ContaBancariaAdmin(admin.ModelAdmin):
    list_display = ("nome", "tipo", "taxa_administrativa_pct", "prazo_recebimento_dias", "saldo_atual", "ativo")
    list_filter = ("tipo", "ativo")
    search_fields = ("nome",)


@admin.register(Titulo)
class TituloAdmin(admin.ModelAdmin):
    list_display = ("id", "os", "cliente", "valor_original", "valor_atualizado", "vencimento", "status")
    list_filter = ("status",)
    raw_id_fields = ("os", "cliente")


@admin.register(Transacao)
class TransacaoAdmin(admin.ModelAdmin):
    list_display = ("id", "titulo", "plano_contas", "valor_pago", "juros", "multa", "data_caixa", "delta_variacao_os")
    list_filter = ("plano_contas",)
    raw_id_fields = ("titulo", "plano_contas")


@admin.register(Renegociacao)
class RenegociacaoAdmin(admin.ModelAdmin):
    list_display = ("id", "titulo_antigo", "titulo_novo", "valor_acrescimo", "criado_em")
    raw_id_fields = ("titulo_antigo", "titulo_novo")


class MetaContaInline(admin.TabularInline):
    model = MetaConta
    extra = 0


@admin.register(CicloOrcamento)
class CicloOrcamentoAdmin(admin.ModelAdmin):
    list_display = ("ano", "quadrimestre", "status")
    list_filter = ("status",)
    inlines = [MetaContaInline]
