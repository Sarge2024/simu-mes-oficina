from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import EmpresaFilial, Cliente
from .serializers import EmpresaFilialSerializer, ClienteSerializer

class EmpresaFilialViewSet(viewsets.ModelViewSet):
    queryset = EmpresaFilial.objects.all()
    serializer_class = EmpresaFilialSerializer
    permission_classes = [AllowAny] # Using AllowAny temporarily for Dev, like the other apps

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [AllowAny]
