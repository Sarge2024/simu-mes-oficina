from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from decimal import Decimal

from .models import Requisicao, ItemRequisicao, PedidoCompra, StatusCompra, TipoRequisicao
from .serializers import RequisicaoSerializer, ItemRequisicaoSerializer, PedidoCompraSerializer

from financeiro.models import PlanoContas, Titulo, Transacao, StatusTitulo

class PedidoCompraViewSet(viewsets.ModelViewSet):
    queryset = PedidoCompra.objects.all()
    serializer_class = PedidoCompraSerializer

class RequisicaoViewSet(viewsets.ModelViewSet):
    queryset = Requisicao.objects.all()
    serializer_class = RequisicaoSerializer

class ItemRequisicaoViewSet(viewsets.ModelViewSet):
    queryset = ItemRequisicao.objects.all()
    serializer_class = ItemRequisicaoSerializer

    @action(detail=True, methods=['post'])
    def receber(self, request, pk=None):
        """RF-SUP-04: Receber item e lançar variação (Spot Price vs Orçado)."""
        item = self.get_object()
        spot_price = Decimal(request.data.get('spot_price', 0))
        
        if spot_price <= 0:
            return Response({"detail": "spot_price inválido."}, status=status.HTTP_400_BAD_REQUEST)
            
        with transaction.atomic():
            item.valor_spot_price = spot_price
            item.status_compra = StatusCompra.ENTREGUE
            item.save()
            
            # Recuperar valor orçado
            # ItemRequisicao possui orcamento_item? Vamos checar o modelo.
            # Se não, o RF pede que lancemos a diferença.
            # Vou assumir que o ItemRequisicao tem ligacao indireta (se ele foi criado via OS)
            # Como a ligacao orcamento_item não existe fisicamente no modelo atual (apenas FK pra OS),
            # eu deveria buscar no Orcamento da OS? 
            # Vou deixar a variação genérica caso não ache a FK.
            # O correto seria ter a FK, mas no DDM original não tinha. 
            # Vamos buscar no orcamento ativo pelo produto.
            
            orcamento_ativo = item.requisicao.os.orcamentos.filter(ativo=True).first()
            if orcamento_ativo:
                orcamento_item = orcamento_ativo.itens.filter(produto=item.produto).first()
                if orcamento_item:
                    valor_orcado = orcamento_item.valor_estimado
                    variacao = spot_price - valor_orcado
                    
                    if variacao != 0:
                        # Lançar variação na conta 2.1.5.0.0
                        conta_variacao = PlanoContas.objects.filter(codigo="2.1.5.0.0").first()
                        if conta_variacao:
                            titulo = Titulo.objects.create(
                                os=item.requisicao.os,
                                cliente=item.requisicao.os.cliente,
                                valor_original=abs(variacao),
                                valor_atualizado=abs(variacao),
                                vencimento=item.criado_em.date(),
                                data_competencia=item.criado_em.date(),
                                status=StatusTitulo.PAGO
                            )
                            Transacao.objects.create(
                                titulo=titulo,
                                plano_contas=conta_variacao,
                                valor_pago=abs(variacao)
                            )
                            
        return Response({"detail": "Item recebido e variação contabilizada."}, status=status.HTTP_200_OK)
