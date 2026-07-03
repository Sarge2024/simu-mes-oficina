from rest_framework import serializers
from .models import Marca, Modelo, Versao, CotacaoMercado, Ativo, Motor, Categoria

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class MarcaSerializer(serializers.ModelSerializer):
    categorias = serializers.SerializerMethodField()

    class Meta:
        model = Marca
        fields = ['id', 'nome_marca', 'ativo', 'criado_em', 'categorias']

    def get_categorias(self, obj):
        # Retorna lista de categorias únicas vinculadas aos modelos desta marca
        return list(obj.modelos.values_list('categoria__nome', flat=True).distinct())

class MotorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Motor
        fields = '__all__'

class ModeloSerializer(serializers.ModelSerializer):
    marca_nome = serializers.CharField(source='marca.nome_marca', read_only=True)
    categoria_nome = serializers.CharField(source='categoria.nome', read_only=True)
    class Meta:
        model = Modelo
        fields = '__all__'

class VersaoSerializer(serializers.ModelSerializer):
    modelo_nome = serializers.CharField(source='modelo.nome_modelo', read_only=True)
    marca_nome = serializers.CharField(source='modelo.marca.nome_marca', read_only=True)
    marca_id = serializers.IntegerField(source='modelo.marca_id', read_only=True)
    categoria = serializers.IntegerField(source='modelo.categoria_id', read_only=True)
    motor_familia = serializers.CharField(source='motor.codigo_familia', read_only=True)
    class Meta:
        model = Versao
        fields = '__all__'

class CotacaoMercadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CotacaoMercado
        fields = '__all__'

class AtivoSerializer(serializers.ModelSerializer):
    versao_nome = serializers.CharField(source='versao.nome_versao', read_only=True)
    modelo_nome = serializers.CharField(source='versao.modelo.nome_modelo', read_only=True)
    modelo_id = serializers.IntegerField(source='versao.modelo_id', read_only=True)
    marca_id = serializers.IntegerField(source='versao.modelo.marca_id', read_only=True)
    marca_nome = serializers.CharField(source='versao.modelo.marca.nome_marca', read_only=True)
    cliente_nome = serializers.CharField(source='cliente.nome_razao', read_only=True)

    class Meta:
        model = Ativo
        fields = '__all__'
