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
from governanca.models import Parametro

class OrdemServicoViewSet(viewsets.ModelViewSet):
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


class OrcamentoViewSet(viewsets.ModelViewSet):
    queryset = Orcamento.objects.all()
    serializer_class = OrcamentoSerializer

class OrcamentoItemViewSet(viewsets.ModelViewSet):
    queryset = OrcamentoItem.objects.all()
    serializer_class = OrcamentoItemSerializer

class RecursoFisicoViewSet(viewsets.ModelViewSet):
    queryset = RecursoFisico.objects.all()
    serializer_class = RecursoFisicoSerializer

class AlocacaoViewSet(viewsets.ModelViewSet):
    queryset = Alocacao.objects.all()
    serializer_class = AlocacaoSerializer
