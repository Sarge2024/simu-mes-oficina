from rest_framework import serializers
from .models import PlanoContas, Titulo, Transacao, Renegociacao, CicloOrcamento, MetaConta, ContaBancaria

class ContaBancariaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContaBancaria
        fields = '__all__'

class PlanoContasSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanoContas
        fields = '__all__'

class TransacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transacao
        fields = '__all__'

class RenegociacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Renegociacao
        fields = '__all__'

class TituloSerializer(serializers.ModelSerializer):
    transacoes = TransacaoSerializer(many=True, read_only=True)
    class Meta:
        model = Titulo
        fields = '__all__'
