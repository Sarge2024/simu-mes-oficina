from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ComponenteViewSet, ReferenciaFabricanteViewSet, AplicacaoMotorViewSet, ServicoCatalogoViewSet, AplicacaoVeiculoViewSet

router = DefaultRouter()
router.register(r'componentes', ComponenteViewSet, basename='componente')
router.register(r'referencias', ReferenciaFabricanteViewSet, basename='referencia')
router.register(r'aplicacoes', AplicacaoMotorViewSet, basename='aplicacao')
router.register(r'aplicacoes_veiculos', AplicacaoVeiculoViewSet, basename='aplicacao_veiculo')
router.register(r'servicos', ServicoCatalogoViewSet, basename='servico')

urlpatterns = [
    path('', include(router.urls)),
]
