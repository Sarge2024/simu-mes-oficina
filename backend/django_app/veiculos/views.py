from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Marca, Modelo, Versao, CotacaoMercado, Ativo, Motor
from .serializers import MarcaSerializer, ModeloSerializer, VersaoSerializer, CotacaoMercadoSerializer, AtivoSerializer, MotorSerializer

class MarcaViewSet(viewsets.ModelViewSet):
    queryset = Marca.objects.all()
    serializer_class = MarcaSerializer
    permission_classes = [AllowAny]

class MotorViewSet(viewsets.ModelViewSet):
    queryset = Motor.objects.all()
    serializer_class = MotorSerializer
    permission_classes = [AllowAny]

class ModeloViewSet(viewsets.ModelViewSet):
    serializer_class = ModeloSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Modelo.objects.all()
        marca = self.request.query_params.get('marca', None)
        if marca is not None:
            queryset = queryset.filter(marca_id=marca)
        return queryset

class VersaoViewSet(viewsets.ModelViewSet):
    serializer_class = VersaoSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Versao.objects.select_related('modelo__marca').all()
        modelo_id = self.request.query_params.get('modelo', None)
        if modelo_id is not None:
            queryset = queryset.filter(modelo_id=modelo_id)
        return queryset

class CotacaoMercadoViewSet(viewsets.ModelViewSet):
    queryset = CotacaoMercado.objects.all()
    serializer_class = CotacaoMercadoSerializer
    permission_classes = [AllowAny]

class AtivoViewSet(viewsets.ModelViewSet):
    queryset = Ativo.objects.select_related('versao__modelo__marca', 'cliente').all()
    serializer_class = AtivoSerializer
    permission_classes = [AllowAny]
