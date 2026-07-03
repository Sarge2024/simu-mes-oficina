import threading

_thread_locals = threading.local()


def get_current_user():
    """Retorna o usuário autenticado atual a partir do thread-local."""
    return getattr(_thread_locals, 'user', None)

def get_current_tenant():
    """Retorna o ID do tenant (EmpresaFilial) atual a partir do thread-local."""
    return getattr(_thread_locals, 'tenant_id', None)

def is_master_request():
    """Retorna True se a requisição foi feita por um usuário MASTER."""
    return getattr(_thread_locals, 'is_master', False)


class CurrentUserMiddleware:
    """Middleware que armazena o usuário autenticado no thread-local para acesso nos signals."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _thread_locals.user = getattr(request, 'user', None)
        response = self.get_response(request)
        return response


class CurrentTenantMiddleware:
    """Middleware que armazena o ID do tenant atual no thread-local (a partir do header HTTP)."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        tenant_id = request.headers.get('X-Tenant-ID') or request.META.get('HTTP_X_TENANT_ID')
        _thread_locals.tenant_id = tenant_id
        _thread_locals.is_master = (request.headers.get('X-Master-Role') == 'true')
        response = self.get_response(request)
        return response
