from rest_framework import serializers, viewsets
from .models import Parametro
from django.urls import path, include
from rest_framework.routers import DefaultRouter

class ParametroSerializer(serializers.ModelSerializer):
    class Meta:
        model = Parametro
        fields = '__all__'

class ParametroViewSet(viewsets.ModelViewSet):
    queryset = Parametro.objects.all()
    serializer_class = ParametroSerializer

router = DefaultRouter()
router.register(r'parametro', ParametroViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
