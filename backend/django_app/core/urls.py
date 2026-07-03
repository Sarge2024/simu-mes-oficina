from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmpresaFilialViewSet, ClienteViewSet, AuditLogViewSet

router = DefaultRouter()
router.register(r'empresas', EmpresaFilialViewSet, basename='empresa-filial')
router.register(r'clientes', ClienteViewSet, basename='cliente')
router.register(r'logs-auditoria', AuditLogViewSet, basename='audit-log')

urlpatterns = [
    path('', include(router.urls)),
]
