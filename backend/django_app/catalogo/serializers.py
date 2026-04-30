from rest_framework import serializers
from .models import Componente, ReferenciaFabricante, AplicacaoMotor, ServicoCatalogo

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
        # Busca componentes do mesmo tipo e medidas, excluindo o próprio
        qs = Componente.objects.filter(
            tipo_componente=obj.tipo_componente,
            medidas_tecnicas=obj.medidas_tecnicas
        ).exclude(id=obj.id)[:10]  # Limita a 10 resultados
        
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
