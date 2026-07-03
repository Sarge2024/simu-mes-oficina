from rest_framework import serializers
from .models import Componente, ReferenciaFabricante, AplicacaoMotor, ServicoCatalogo, AplicacaoVeiculo

class ServicoCatalogoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServicoCatalogo
        fields = '__all__'

class ComponenteSerializer(serializers.ModelSerializer):
    similares = serializers.SerializerMethodField()

    class Meta:
        model = Componente
        fields = '__all__'

    def get_similares(self, obj):
        qs = Componente.objects.filter(
            tipo_componente=obj.tipo_componente,
            medidas_tecnicas=obj.medidas_tecnicas
        ).exclude(id=obj.id)[:10]
        
        return [{
            'id': c.id,
            'codigo_interno': c.codigo_interno,
            'descricao_generica': c.descricao_generica,
            'estoque_atual': c.estoque_atual,
            'preco_venda': float(c.preco_venda)
        } for c in qs]

class ReferenciaFabricanteSerializer(serializers.ModelSerializer):
    marca_nome = serializers.CharField(source='marca.nome_marca', read_only=True)
    componente_codigo = serializers.CharField(source='componente.codigo_interno', read_only=True)

    class Meta:
        model = ReferenciaFabricante
        fields = '__all__'

class AplicacaoMotorSerializer(serializers.ModelSerializer):
    componente_codigo = serializers.CharField(source='componente.codigo_interno', read_only=True)
    motor_familia = serializers.CharField(source='motor.codigo_familia', read_only=True)
    motor_cilindradas = serializers.CharField(source='motor.cilindradas', read_only=True)

    class Meta:
        model = AplicacaoMotor
        fields = '__all__'

class AplicacaoVeiculoSerializer(serializers.ModelSerializer):
    componente_codigo = serializers.CharField(source='componente.codigo_interno', read_only=True)
    versao_nome = serializers.CharField(source='versao.nome_versao', read_only=True)
    modelo_nome = serializers.CharField(source='versao.modelo.nome_modelo', read_only=True)
    marca_nome = serializers.CharField(source='versao.modelo.marca.nome_marca', read_only=True)

    class Meta:
        model = AplicacaoVeiculo
        fields = '__all__'
