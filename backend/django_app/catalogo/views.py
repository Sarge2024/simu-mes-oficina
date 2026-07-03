from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Componente, ReferenciaFabricante, AplicacaoMotor, ServicoCatalogo, AplicacaoVeiculo
from .serializers import ComponenteSerializer, ReferenciaFabricanteSerializer, AplicacaoMotorSerializer, ServicoCatalogoSerializer, AplicacaoVeiculoSerializer

class ComponenteViewSet(viewsets.ModelViewSet):
    queryset = Componente.objects.all()
    serializer_class = ComponenteSerializer
    permission_classes = [AllowAny]

class ReferenciaFabricanteViewSet(viewsets.ModelViewSet):
    queryset = ReferenciaFabricante.objects.select_related('marca', 'componente').all()
    serializer_class = ReferenciaFabricanteSerializer
    permission_classes = [AllowAny]
    filterset_fields = ['componente']

class AplicacaoMotorViewSet(viewsets.ModelViewSet):
    queryset = AplicacaoMotor.objects.select_related('componente', 'motor').all()
    serializer_class = AplicacaoMotorSerializer
    permission_classes = [AllowAny]

class AplicacaoVeiculoViewSet(viewsets.ModelViewSet):
    queryset = AplicacaoVeiculo.objects.select_related('componente', 'versao', 'versao__modelo', 'versao__modelo__marca').all()
    serializer_class = AplicacaoVeiculoSerializer
    permission_classes = [AllowAny]
    filterset_fields = ['componente', 'versao']

class ServicoCatalogoViewSet(viewsets.ModelViewSet):
    queryset = ServicoCatalogo.objects.all()
    serializer_class = ServicoCatalogoSerializer
    permission_classes = [AllowAny]
