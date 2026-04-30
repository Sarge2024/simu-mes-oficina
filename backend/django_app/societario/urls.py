from rest_framework import serializers, viewsets
from .models import MovimentoSocio
from django.urls import path, include
from rest_framework.routers import DefaultRouter

class MovimentoSocioSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimentoSocio
        fields = '__all__'

class MovimentoSocioViewSet(viewsets.ModelViewSet):
    queryset = MovimentoSocio.objects.all()
    serializer_class = MovimentoSocioSerializer

router = DefaultRouter()
router.register(r'movimento-socio', MovimentoSocioViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
