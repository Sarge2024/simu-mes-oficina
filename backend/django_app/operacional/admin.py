from django.contrib import admin
from .models import OrdemServico, Orcamento, OrcamentoItem, HistoricoAprovacao, RecursoFisico, Alocacao


class OrcamentoItemInline(admin.TabularInline):
    model = OrcamentoItem
    extra = 0
    readonly_fields = ("delta_variacao_os",)


class OrcamentoInline(admin.TabularInline):
    model = Orcamento
    extra = 0
    show_change_link = True


@admin.register(OrdemServico)
class OrdemServicoAdmin(admin.ModelAdmin):
    list_display = ("id", "veiculo", "status", "data_in", "data_out")
    list_filter = ("status",)
    search_fields = ("veiculo__placa",)
    raw_id_fields = ("veiculo",)
    inlines = [OrcamentoInline]


@admin.register(Orcamento)
class OrcamentoAdmin(admin.ModelAdmin):
    list_display = ("id", "os", "versao", "is_active", "status_aprovacao", "valor_total")
    list_filter = ("status_aprovacao", "is_active")
    inlines = [OrcamentoItemInline]


@admin.register(HistoricoAprovacao)
class HistoricoAprovacaoAdmin(admin.ModelAdmin):
    list_display = ("os", "usuario_aprovador", "valor_antes", "valor_aditivo", "criado_em")
    raw_id_fields = ("os", "usuario_aprovador")


@admin.register(RecursoFisico)
class RecursoFisicoAdmin(admin.ModelAdmin):
    list_display = ("nome", "tipo", "ativo")
    list_filter = ("tipo", "ativo")


@admin.register(Alocacao)
class AlocacaoAdmin(admin.ModelAdmin):
    list_display = ("os", "recurso", "colaborador", "data_inicio", "data_fim")
    list_filter = ("recurso", "colaborador")
    raw_id_fields = ("os", "recurso", "colaborador")
