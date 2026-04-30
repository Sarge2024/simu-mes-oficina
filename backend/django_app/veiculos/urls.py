from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MarcaViewSet, ModeloViewSet, VersaoViewSet, CotacaoMercadoViewSet, AtivoViewSet, MotorViewSet

router = DefaultRouter()
router.register(r'marcas', MarcaViewSet, basename='marca')
router.register(r'modelos', ModeloViewSet, basename='modelo')
router.register(r'versoes', VersaoViewSet, basename='versao')
router.register(r'motores', MotorViewSet, basename='motor')
router.register(r'cotacoes', CotacaoMercadoViewSet, basename='cotacao')
router.register(r'ativos', AtivoViewSet, basename='ativo')

urlpatterns = [
    path('', include(router.urls)),
]
