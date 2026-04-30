from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RequisicaoViewSet, ItemRequisicaoViewSet, PedidoCompraViewSet

router = DefaultRouter()
router.register(r'requisicao', RequisicaoViewSet)
router.register(r'item-requisicao', ItemRequisicaoViewSet)
router.register(r'pedido-compra', PedidoCompraViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
