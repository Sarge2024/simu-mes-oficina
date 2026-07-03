"""
Suprimentos — Requisições de compra e itens.

Tabelas: Sup_Requisicao, Sup_ItemRequisicao.
"""
from django.db import models


class TipoRequisicao(models.TextChoices):
    PRELIMINAR = "preliminar", "Preliminar"
    CONFIRMADA = "confirmada", "Confirmada"
    COMPLEMENTAR = "complementar", "Complementar"


class StatusRequisicao(models.TextChoices):
    ABERTA = "aberta", "Aberta"
    EM_COTACAO = "em_cotacao", "Em Cotação"
    APROVADA = "aprovada", "Aprovada"
    PARCIAL = "parcial", "Parcialmente Atendida"
    ATENDIDA = "atendida", "Atendida"
    CANCELADA = "cancelada", "Cancelada"


class Requisicao(models.Model):
    os = models.ForeignKey("operacional.OrdemServico", on_delete=models.CASCADE, related_name="requisicoes")
    tipo = models.CharField(max_length=20, choices=TipoRequisicao.choices, default=TipoRequisicao.PRELIMINAR)
    status = models.CharField(max_length=20, choices=StatusRequisicao.choices, default=StatusRequisicao.ABERTA)
    observacoes = models.TextField(blank=True, default="")
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "sup_requisicao"
        verbose_name = "Requisição de Compra"
        verbose_name_plural = "Requisições de Compra"
        ordering = ["-criado_em"]

    def __str__(self):
        return f"Req #{self.pk} — OS#{self.os_id} ({self.get_tipo_display()})"


class StatusPedido(models.TextChoices):
    RASCUNHO = "rascunho", "Rascunho"
    ENVIADO = "enviado", "Enviado ao Fornecedor"
    CONFIRMADO = "confirmado", "Confirmado"
    RECEBIDO_PARCIAL = "recebido_parcial", "Recebido Parcialmente"
    CONCLUIDO = "concluido", "Concluído"
    CANCELADO = "cancelado", "Cancelado"

class PedidoCompra(models.Model):
    fornecedor = models.ForeignKey("core.Cliente", on_delete=models.PROTECT, related_name="pedidos_compra")
    status = models.CharField(max_length=20, choices=StatusPedido.choices, default=StatusPedido.RASCUNHO)
    data_emissao = models.DateTimeField(auto_now_add=True)
    data_prevista_entrega = models.DateField(null=True, blank=True)
    valor_total_estimado = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    
    class Meta:
        db_table = "sup_pedido_compra"
        verbose_name = "Pedido de Compra"
        verbose_name_plural = "Pedidos de Compra"

    def __str__(self):
        return f"Pedido #{self.pk} - {self.fornecedor.razao_social}"


class StatusCompra(models.TextChoices):
    PENDENTE = "pendente", "Pendente"
    COTADO = "cotado", "Cotado"
    COMPRADO = "comprado", "Comprado"
    RECEBIDO = "recebido", "Recebido"
    CANCELADO = "cancelado", "Cancelado"


class ItemRequisicao(models.Model):
    requisicao = models.ForeignKey(Requisicao, on_delete=models.CASCADE, related_name="itens")
    produto = models.ForeignKey("catalogo.Componente", on_delete=models.PROTECT, related_name="itens_requisicao")
    quantidade = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    status_compra = models.CharField(max_length=20, choices=StatusCompra.choices, default=StatusCompra.PENDENTE)
    valor_spot_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    fornecedor = models.ForeignKey("core.Cliente", on_delete=models.SET_NULL, null=True, blank=True, related_name="itens_requisicao")
    pedido_compra = models.ForeignKey(PedidoCompra, on_delete=models.SET_NULL, null=True, blank=True, related_name="itens")
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "sup_item_requisicao"
        verbose_name = "Item de Requisição"
        verbose_name_plural = "Itens de Requisição"

    def __str__(self):
        return f"Item #{self.pk}: {self.produto.codigo_interno} × {self.quantidade}"


class EntradaNFe(models.Model):
    chave_acesso_nfe = models.CharField("Chave de Acesso NFe", max_length=44, unique=True, help_text="44 dígitos numéricos")
    fornecedor = models.ForeignKey("core.Cliente", on_delete=models.PROTECT, related_name="entradas_nfe")
    data_emissao = models.DateField("Data de Emissão")
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "sup_entrada_nfe"
        verbose_name = "Entrada NFe"
        verbose_name_plural = "Entradas NFe"
        ordering = ["-data_emissao"]

    def __str__(self):
        return f"NFe {self.chave_acesso_nfe} - {self.fornecedor.razao_social}"


class ItemNFe(models.Model):
    entrada_nfe = models.ForeignKey(EntradaNFe, on_delete=models.CASCADE, related_name="itens", verbose_name="NFe")
    componente = models.ForeignKey("catalogo.Componente", on_delete=models.PROTECT, related_name="compras_nfe", verbose_name="Componente Genérico")
    valor_unitario_compra = models.DecimalField("Valor Unitário (R$)", max_digits=12, decimal_places=2)
    quantidade = models.DecimalField("Quantidade", max_digits=10, decimal_places=2, default=1)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "sup_item_nfe"
        verbose_name = "Item da NFe"
        verbose_name_plural = "Itens da NFe"

    def __str__(self):
        return f"{self.quantidade}x {self.componente.codigo_interno} (R$ {self.valor_unitario_compra})"
