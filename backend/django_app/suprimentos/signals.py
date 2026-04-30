from django.db.models.signals import post_save
from django.dispatch import receiver
from operacional.models import OrdemServico, StatusOS
from .models import Requisicao, TipoRequisicao

@receiver(post_save, sender=OrdemServico)
def atualizar_requisicoes(sender, instance, **kwargs):
    """RF-SUP-02: Engatilhar requisições preliminares para confirmadas ao iniciar serviço."""
    if instance.status == StatusOS.EM_EXECUCAO:
        Requisicao.objects.filter(
            os=instance, 
            tipo=TipoRequisicao.PRELIMINAR
        ).update(tipo=TipoRequisicao.CONFIRMADA)
