from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Componente, ReferenciaFabricante, AplicacaoMotor, ServicoCatalogo
from .serializers import ComponenteSerializer, ReferenciaFabricanteSerializer, AplicacaoMotorSerializer, ServicoCatalogoSerializer

class ComponenteViewSet(viewsets.ModelViewSet):
    queryset = Componente.objects.all()
    serializer_class = ComponenteSerializer
    permission_classes = [AllowAny]

class ReferenciaFabricanteViewSet(viewsets.ModelViewSet):
    queryset = ReferenciaFabricante.objects.select_related('marca', 'componente').all()
    serializer_class = ReferenciaFabricanteSerializer
    permission_classes = [AllowAny]

class AplicacaoMotorViewSet(viewsets.ModelViewSet):
    queryset = AplicacaoMotor.objects.select_related('componente', 'motor').all()
    serializer_class = AplicacaoMotorSerializer
    permission_classes = [AllowAny]

class ServicoCatalogoViewSet(viewsets.ModelViewSet):
    queryset = ServicoCatalogo.objects.all()
    serializer_class = ServicoCatalogoSerializer
    permission_classes = [AllowAny]
