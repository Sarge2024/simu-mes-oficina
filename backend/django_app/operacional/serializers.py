from decimal import Decimal

from rest_framework import serializers

from .models import OrdemServico, Orcamento, OrcamentoItem, HistoricoAprovacao, RecursoFisico, Alocacao

class OrcamentoItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrcamentoItem
        fields = '__all__'
        read_only_fields = ('valor_estimado', 'valor_real', 'delta_variacao_os')

    def validate(self, data):
        # RF-SUP-01: Checar saldo de estoque ao inserir item no orçamento
        produto = data.get('produto')
        quantidade = data.get('quantidade', 1)
        if produto and not produto.flag_jit:
            if produto.estoque_atual < quantidade:
                raise serializers.ValidationError(f"Estoque insuficiente para {produto.descricao}. Disponível: {produto.estoque_atual}")
        return data

    def create(self, validated_data):
        # RF-OP-03: Precificação Automática
        produto = validated_data.get('produto')
        servico = validated_data.get('servico')
        is_terceiro = validated_data.get('is_terceiro', False)
        
        # Define valor_estimado
        if produto:
            # Exemplo: Markup de 30% sobre custo_medio
            validated_data['valor_estimado'] = produto.custo_medio * Decimal('1.30')
        elif servico:
            validated_data['valor_estimado'] = servico.preco_base
        elif is_terceiro:
            # Terceiro precisa de um valor base informado ou cálculo com fornecedor
            # Assumindo que se vier do payload nós mantemos, ou 0 se não tiver.
            # Como fizemos read_only no serializer, temos que permitir envio ou calcular.
            # Para simplificar, deixamos 0 ou permitiríamos no serializer se não fosse read_only.
            pass
            
        return super().create(validated_data)

class OrcamentoSerializer(serializers.ModelSerializer):
    itens = OrcamentoItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Orcamento
        fields = '__all__'

class HistoricoAprovacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoricoAprovacao
        fields = '__all__'

class OrdemServicoSerializer(serializers.ModelSerializer):
    orcamentos = OrcamentoSerializer(many=True, read_only=True)
    
    class Meta:
        model = OrdemServico
        fields = '__all__'

class RecursoFisicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecursoFisico
        fields = '__all__'

class AlocacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alocacao
        fields = '__all__'
