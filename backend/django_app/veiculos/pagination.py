from rest_framework.pagination import PageNumberPagination

class StandardPagination(PageNumberPagination):
    """Paginação padrão com suporte a page_size via query param."""
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200
