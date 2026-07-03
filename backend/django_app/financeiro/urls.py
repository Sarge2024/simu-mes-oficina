from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TituloViewSet, TransacaoViewSet, ContaBancariaViewSet, PlanoContasViewSet

router = DefaultRouter()
router.register(r'titulo', TituloViewSet)
router.register(r'transacao', TransacaoViewSet)
router.register(r'conta-bancaria', ContaBancariaViewSet)
router.register(r'plano-contas', PlanoContasViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
