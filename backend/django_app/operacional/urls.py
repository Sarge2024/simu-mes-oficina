from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrdemServicoViewSet, OrcamentoViewSet, OrcamentoItemViewSet, RecursoFisicoViewSet, AlocacaoViewSet

router = DefaultRouter()
router.register(r'os', OrdemServicoViewSet)
router.register(r'orcamento', OrcamentoViewSet)
router.register(r'orcamento-item', OrcamentoItemViewSet)
router.register(r'recurso-fisico', RecursoFisicoViewSet)
router.register(r'alocacao', AlocacaoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
