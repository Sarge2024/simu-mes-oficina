from django.contrib import admin
from .models import EmpresaFilial, Cliente, Fornecedor, Colaborador


@admin.register(EmpresaFilial)
class EmpresaFilialAdmin(admin.ModelAdmin):
    list_display = ("razao_social", "cnpj", "ativo")
    search_fields = ("razao_social", "cnpj")
    list_filter = ("ativo",)


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ("nome_razao", "cpf_cnpj", "categoria_contrato", "limite_credito", "ativo")
    search_fields = ("nome_razao", "cpf_cnpj")
    list_filter = ("categoria_contrato", "ativo")


@admin.register(Fornecedor)
class FornecedorAdmin(admin.ModelAdmin):
    list_display = ("razao_social", "cnpj", "prazo_faturamento", "lead_time", "ativo")
    search_fields = ("razao_social", "cnpj")
    list_filter = ("ativo",)


@admin.register(Colaborador)
class ColaboradorAdmin(admin.ModelAdmin):
    list_display = ("nome", "cargo", "especialidade", "custo_hora", "ativo")
    search_fields = ("nome", "cargo", "especialidade")
    list_filter = ("ativo", "especialidade")
