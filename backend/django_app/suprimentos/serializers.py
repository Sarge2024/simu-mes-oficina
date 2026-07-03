from rest_framework import serializers
from .models import Requisicao, ItemRequisicao, PedidoCompra, LocalizacaoEstoque

class PedidoCompraSerializer(serializers.ModelSerializer):
    class Meta:
        model = PedidoCompra
        fields = '__all__'

class ItemRequisicaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemRequisicao
        fields = '__all__'

class RequisicaoSerializer(serializers.ModelSerializer):
    itens = ItemRequisicaoSerializer(many=True, read_only=True)
    class Meta:
        model = Requisicao
        fields = '__all__'

class LocalizacaoEstoqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocalizacaoEstoque
        fields = '__all__'
        read_only_fields = ('codigo',)
