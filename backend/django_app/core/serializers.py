from rest_framework import serializers
from .models import EmpresaFilial, Cliente, AuditLog

class EmpresaFilialSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmpresaFilial
        fields = '__all__'

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'
