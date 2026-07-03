import logging
from django.db import transaction
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.forms.models import model_to_dict
import json

from core.models import Cliente, Colaborador, AuditLog
from core.middleware import get_current_user
from veiculos.models import Ativo, Marca, Modelo, Versao
from catalogo.models import Componente, ServicoCatalogo
from operacional.models import OrdemServico, Orcamento, OrcamentoItem, HistoricoAprovacao, Alocacao

logger = logging.getLogger(__name__)

WATCHED_MODELS = [
    Cliente,
    Colaborador,
    Ativo,
    Marca,
    Modelo,
    Versao,
    Componente,
    ServicoCatalogo,
    OrdemServico,
    Orcamento,
    OrcamentoItem,
    HistoricoAprovacao,
    Alocacao,
]


def _serialize_instance(instance):
    """Serializa uma instância de modelo para dict JSON-safe."""
    try:
        data = model_to_dict(instance)
        return json.loads(json.dumps(data, default=str))
    except Exception as e:
        return {"error": f"Falha na serialização: {str(e)}"}


def _get_current_user_name():
    """Obtém o nome do usuário atual a partir do thread-local."""
    user = get_current_user()
    if user and user.is_authenticated:
        return user.get_username()
    return "Sistema"


@transaction.atomic
def log_action(sender, instance, action):
    """Gera um registro na tabela de auditoria com proteção atômica contra race conditions."""
    try:
        detalhes_pos = _serialize_instance(instance)
        usuario = _get_current_user_name()

        detalhamento = ""
        detalhes_para_log = detalhes_pos

        if action == "Editado":
            ultimo_log = AuditLog.objects.filter(
                tabela=sender._meta.label,
                registro_id=str(instance.pk),
            ).order_by('-timestamp').first()

            if ultimo_log and ultimo_log.detalhes:
                # Para rollback: armazenamos o estado ANTERIOR (pre-edit) em detalhes
                detalhes_para_log = ultimo_log.detalhes

                # Detalhamento mostra a mudança detectada (pre -> post)
                changes = []
                for field, new_val in detalhes_pos.items():
                    old_val = ultimo_log.detalhes.get(field)
                    if str(old_val) != str(new_val):
                        changes.append(f"• {field}: '{old_val}' ➔ '{new_val}'")

                if changes:
                    detalhamento = "Alterações detectadas:\n" + "\n".join(changes)
                else:
                    detalhamento = "Nenhuma alteração de valor detectada nos campos monitorados."
        elif action == "Criado":
            detalhamento = "Registro inicial criado com os seguintes dados: " + str(detalhes_pos)
        elif action == "Excluído":
            detalhamento = "Registro removido do sistema."

        AuditLog.objects.create(
            usuario=usuario,
            tabela=sender._meta.label,
            registro_id=str(instance.pk),
            acao=action,
            detalhes=detalhes_para_log,
            detalhamento=detalhamento,
        )
    except Exception as e:
        logger.error(f"Erro ao gerar log de auditoria para {sender._meta.label}#{instance.pk}: {str(e)}", exc_info=True)


@receiver(post_save)
def audit_post_save(sender, instance, created, **kwargs):
    """Monitora criações e edições."""
    if sender in WATCHED_MODELS:
        action = "Criado" if created else "Editado"
        log_action(sender, instance, action)


@receiver(post_delete)
def audit_post_delete(sender, instance, **kwargs):
    """Monitora exclusões."""
    if sender in WATCHED_MODELS:
        log_action(sender, instance, "Excluído")
