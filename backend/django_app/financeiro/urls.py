from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TituloViewSet, TransacaoViewSet, ContaBancariaViewSet

router = DefaultRouter()
router.register(r'titulo', TituloViewSet)
router.register(r'transacao', TransacaoViewSet)
router.register(r'conta-bancaria', ContaBancariaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
