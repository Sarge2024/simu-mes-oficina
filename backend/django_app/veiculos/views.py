from django.db.models import Q, ProtectedError
from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Marca, Modelo, Versao, CotacaoMercado, Ativo, Motor, Categoria
from .serializers import MarcaSerializer, ModeloSerializer, VersaoSerializer, CotacaoMercadoSerializer, AtivoSerializer, MotorSerializer, CategoriaSerializer

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [AllowAny]

class MarcaViewSet(viewsets.ModelViewSet):
    queryset = Marca.objects.all()
    serializer_class = MarcaSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Marca.objects.all()
        nome = self.request.query_params.get('nome_marca', None)
        if nome is not None:
            queryset = queryset.filter(nome_marca__iexact=nome)
        categoria = self.request.query_params.get('categoria', None)
        if categoria:
            queryset = queryset.filter(modelos__categoria_veiculo=categoria).distinct()
        return queryset

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
        codigo_fipe = self.request.query_params.get('codigo_fipe', None)
        if codigo_fipe is not None:
            queryset = queryset.filter(codigo_fipe=codigo_fipe)
        return queryset

class CotacaoMercadoViewSet(viewsets.ModelViewSet):
    queryset = CotacaoMercado.objects.all()
    serializer_class = CotacaoMercadoSerializer
    permission_classes = [AllowAny]

class AtivoViewSet(viewsets.ModelViewSet):
    serializer_class = AtivoSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # Sempre filtrar por ativo=True para ocultar os soft-deleted
        queryset = Ativo.objects.select_related('versao__modelo__marca', 'cliente').filter(ativo=True)
        placa = self.request.query_params.get('placa', None)
        if placa is not None:
            # Normaliza a placa removendo hífens e espaços
            placa_limpa = placa.replace('-', '').replace(' ', '').strip()
            # Formato tradicional AAA-1234
            placa_traco = f"{placa_limpa[:3]}-{placa_limpa[3:]}" if len(placa_limpa) == 7 else placa_limpa
            
            queryset = queryset.filter(
                Q(placa__iexact=placa) |
                Q(placa__iexact=placa_limpa) |
                Q(placa__iexact=placa_traco)
            )
        
        cliente = self.request.query_params.get('cliente', None)
        if cliente is not None:
            queryset = queryset.filter(cliente_id=cliente)
            
        return queryset

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProtectedError:
            # Veículo possui Ordens de Serviço vinculadas — faz soft delete
            instance.ativo = False
            instance.save(update_fields=['ativo'])
            return Response(
                {
                    'detail': 'Veículo desativado. Não foi possível excluir permanentemente pois existem Ordens de Serviço vinculadas.',
                    'soft_deleted': True
                },
                status=status.HTTP_200_OK
            )
