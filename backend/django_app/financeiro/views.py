from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from decimal import Decimal

from .models import Titulo, Transacao, Renegociacao, PlanoContas, ContaBancaria, StatusTitulo
from .serializers import TituloSerializer, TransacaoSerializer, ContaBancariaSerializer

class ContaBancariaViewSet(viewsets.ModelViewSet):
    queryset = ContaBancaria.objects.all()
    serializer_class = ContaBancariaSerializer

class TituloViewSet(viewsets.ModelViewSet):
    queryset = Titulo.objects.all()
    serializer_class = TituloSerializer

    @action(detail=True, methods=['post'])
    def renegociar(self, request, pk=None):
        """RF-FIN-04: Renegociação de Títulos."""
        titulo_original = self.get_object()
        
        if titulo_original.status in [StatusTitulo.PAGO, StatusTitulo.CANCELADO]:
            return Response({"detail": "Título não pode ser renegociado."}, status=status.HTTP_400_BAD_REQUEST)
            
        novas_parcelas = request.data.get('parcelas', [])
        motivo = request.data.get('motivo', 'Renegociação a pedido do cliente')
        
        if not novas_parcelas:
            return Response({"detail": "Necessário enviar dados das novas parcelas."}, status=status.HTTP_400_BAD_REQUEST)
            
        with transaction.atomic():
            titulo_original.status = StatusTitulo.CANCELADO
            titulo_original.save()
            
            titulos_criados = []
            for p in novas_parcelas:
                novo_titulo = Titulo.objects.create(
                    os=titulo_original.os,
                    cliente=titulo_original.cliente,
                    valor_original=Decimal(p.get('valor')),
                    valor_atualizado=Decimal(p.get('valor')),
                    vencimento=p.get('vencimento'),
                    data_competencia=titulo_original.data_competencia,
                    status=StatusTitulo.ABERTO
                )
                
                Renegociacao.objects.create(
                    titulo_antigo=titulo_original,
                    titulo_novo=novo_titulo,
                    valor_acrescimo=0,
                    motivo=motivo
                )
                titulos_criados.append(novo_titulo)
                
        serializer = TituloSerializer(titulos_criados, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class TransacaoViewSet(viewsets.ModelViewSet):
    queryset = Transacao.objects.all()
    serializer_class = TransacaoSerializer
