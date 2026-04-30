from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmpresaFilialViewSet, ClienteViewSet

router = DefaultRouter()
router.register(r'empresas', EmpresaFilialViewSet, basename='empresa-filial')
router.register(r'clientes', ClienteViewSet, basename='cliente')

urlpatterns = [
    path('', include(router.urls)),
]
