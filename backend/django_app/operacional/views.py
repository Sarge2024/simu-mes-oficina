from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from decimal import Decimal

from .models import OrdemServico, Orcamento, OrcamentoItem, HistoricoAprovacao, RecursoFisico, Alocacao, StatusOS
from .serializers import (
    OrdemServicoSerializer, OrcamentoSerializer, OrcamentoItemSerializer,
    HistoricoAprovacaoSerializer, RecursoFisicoSerializer, AlocacaoSerializer
)
from core.views import TenantModelViewSet
from governanca.models import Parametro

class OrdemServicoViewSet(TenantModelViewSet):
    queryset = OrdemServico.objects.all()
    serializer_class = OrdemServicoSerializer

    @action(detail=True, methods=['post'])
    def criar_versao_orcamento(self, request, pk=None):
        """RF-OP-05: Versionamento de OS. Clona o orçamento ativo atual."""
        os = self.get_object()
        orcamento_ativo = os.orcamentos.filter(ativo=True).first()
        
        if not orcamento_ativo:
            return Response({"detail": "Nenhum orçamento ativo encontrado para versionar."}, status=status.HTTP_400_BAD_REQUEST)
            
        with transaction.atomic():
            novo_orcamento = Orcamento.objects.create(
                os=os,
                versao=orcamento_ativo.versao + Decimal('0.1'),
                ativo=True
            )
            orcamento_ativo.ativo = False
            orcamento_ativo.save()
            
            # Clonar itens
            for item in orcamento_ativo.itens.all():
                item.pk = None
                item.orcamento = novo_orcamento
                item.save()
                
        serializer = OrcamentoSerializer(novo_orcamento)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def submeter_aprovacao(self, request, pk=None):
        """RF-OP-06: Bloquear se aditivo ultrapassar LIMITE_VARIACAO_OS_PCT."""
        os = self.get_object()
        orcamento_ativo = os.orcamentos.filter(ativo=True).first()
        orcamento_original = os.orcamentos.filter(versao=Decimal('1.0')).first()
        
        if not orcamento_ativo or not orcamento_original:
            return Response({"detail": "Faltam orçamentos para comparar."}, status=status.HTTP_400_BAD_REQUEST)
            
        total_ativo = sum(item.valor_estimado * item.quantidade for item in orcamento_ativo.itens.all())
        total_original = sum(item.valor_estimado * item.quantidade for item in orcamento_original.itens.all())
        
        limite_param = Parametro.objects.filter(slug='LIMITE_VARIACAO_OS_PCT').first()
        limite_pct = limite_param.valor_decimal if limite_param else Decimal('10.0')
        
        if total_original > 0:
            variacao_pct = ((total_ativo - total_original) / total_original) * 100
            if variacao_pct > limite_pct:
                os.status = StatusOS.RETIDO
                os.save()
                return Response({"detail": f"OS retida. Variação ({variacao_pct:.2f}%) acima do limite ({limite_pct}%)."}, status=status.HTTP_403_FORBIDDEN)
        
        os.status = StatusOS.APROVADO
        os.save()
        return Response({"detail": "OS Aprovada com sucesso."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def aprovar_retida(self, request, pk=None):
        """RF-OP-07: Alçada de Aprovação para OS retida."""
        os = self.get_object()
        if os.status != StatusOS.RETIDO:
            return Response({"detail": "A OS não está retida."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Simula aprovação
        os.status = StatusOS.APROVADO
        os.save()
        
        # Salva histórico
        HistoricoAprovacao.objects.create(
            os=os,
            usuario_aprovador=request.user if request.user.is_authenticated else None,
            valor_antes=Decimal('0'), # Poderia ser calculado
            valor_aditivo=Decimal('0') # Poderia ser calculado
        )
        return Response({"detail": "OS Desbloqueada e Aprovada."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def salvar_diagnostico(self, request, pk=None):
        """RF-OP-XX: Salva o diagnóstico técnico gerando o orçamento inicial (V1)."""
        os = self.get_object()
        
        # Desativa orçamentos anteriores se houver refação de diagnóstico
        os.orcamentos.update(is_active=False)
        
        try:
            with transaction.atomic():
                orcamento = Orcamento.objects.create(
                    os=os,
                    versao=1,
                    is_active=True,
                    status_aprovacao='aprovado',  # Dependendo da regra de negócio, pode ser rascunho
                    valor_total=request.data.get('valor_total', 0)
                )
                
                # Adiciona Serviços (Mão de Obra)
                for servico in request.data.get('servicos', []):
                    OrcamentoItem.objects.create(
                        orcamento=orcamento,
                        servico_id=servico.get('id'),
                        quantidade=servico.get('quantidade', 1),
                        valor_estimado=servico.get('valor_estimado', 0),
                        origem='inicial'
                    )
                    
                # Adiciona Peças
                for peca in request.data.get('pecas', []):
                    OrcamentoItem.objects.create(
                        orcamento=orcamento,
                        produto_id=peca.get('id'),
                        quantidade=peca.get('quantidade', 1),
                        valor_estimado=peca.get('valor_estimado', 0),
                        origem='inicial'
                    )
                    
                # Atualiza status da OS para o próximo estágio
                os.status = StatusOS.AGUARDANDO_APROVACAO
                os.save()
                
            serializer = OrcamentoSerializer(orcamento)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def concluir_e_faturar(self, request, pk=None):
        """RF-OP-XX: Conclui a OS e emite faturamento (integração financeira)."""
        os = self.get_object()
        
        # Opcional: Validar se a OS já está concluída ou faturada.
        if os.status == StatusOS.CONCLUIDA:
            return Response({"detail": "A OS já está concluída."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # 1. Atualizar status da OS
            os.status = StatusOS.CONCLUIDA
            os.save()
            
            # 2. Gerar título a receber no financeiro (Integração)
            # Para isso, usaremos o valor total do orçamento ativo
            orcamento_ativo = os.orcamentos.filter(is_active=True).first()
            valor_total = request.data.get('valor_total', orcamento_ativo.valor_total if orcamento_ativo else 0)
            forma_pagamento = request.data.get('forma_pagamento', 'PIX')
            
            # Aqui poderíamos importar o model Titulo de financeiro e criar o registro
            try:
                from financeiro.models import Titulo, StatusTitulo
                
                Titulo.objects.create(
                    os=os,
                    cliente=os.veiculo.cliente if os.veiculo else None,
                    valor_original=Decimal(str(valor_total)),
                    valor_atualizado=Decimal(str(valor_total)),
                    vencimento=os.atualizado_em.date(),
                    data_competencia=os.atualizado_em.date(),
                    status=StatusTitulo.PAGO if forma_pagamento in ['PIX', 'DINHEIRO', 'CARTAO_DEBITO'] else StatusTitulo.ABERTO,
                )
            except Exception as e:
                import logging
                logging.warning(f"Erro ao gerar título financeiro: {str(e)}")
                # Não impede o faturamento no protótipo, mas em prod devíamos parar.

        serializer = self.get_serializer(os)
        return Response(serializer.data, status=status.HTTP_200_OK)


class OrcamentoViewSet(TenantModelViewSet):
    queryset = Orcamento.objects.all()
    serializer_class = OrcamentoSerializer

class OrcamentoItemViewSet(viewsets.ModelViewSet):
    queryset = OrcamentoItem.objects.all()
    serializer_class = OrcamentoItemSerializer

    def get_queryset(self):
        from core.middleware import get_current_tenant
        tenant_id = get_current_tenant()
        if tenant_id:
            return OrcamentoItem.objects.filter(orcamento__tenant_id=tenant_id)
        return OrcamentoItem.objects.none()

class RecursoFisicoViewSet(viewsets.ModelViewSet):
    queryset = RecursoFisico.objects.all()
    serializer_class = RecursoFisicoSerializer

class AlocacaoViewSet(viewsets.ModelViewSet):
    queryset = Alocacao.objects.all()
    serializer_class = AlocacaoSerializer

    def get_queryset(self):
        from core.middleware import get_current_tenant
        tenant_id = get_current_tenant()
        if tenant_id:
            return Alocacao.objects.filter(os__tenant_id=tenant_id)
        return Alocacao.objects.none()
