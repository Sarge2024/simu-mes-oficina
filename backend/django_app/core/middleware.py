import threading

_thread_locals = threading.local()


def get_current_user():
    """Retorna o usuário autenticado atual a partir do thread-local."""
    return getattr(_thread_locals, 'user', None)


class CurrentUserMiddleware:
    """Middleware que armazena o usuário autenticado no thread-local para acesso nos signals."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _thread_locals.user = getattr(request, 'user', None)
        response = self.get_response(request)
        return response
