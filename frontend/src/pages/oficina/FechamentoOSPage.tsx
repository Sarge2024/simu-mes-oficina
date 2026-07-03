import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DefaultLayout from '../../layouts/DefaultLayout';
import Card from '../../components/shared/Card';
import PageHeader from '../../components/shared/PageHeader';
import { djangoApi } from '../../lib/api';

export default function FechamentoOSPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [osData, setOsData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [formaPagamento, setFormaPagamento] = useState('PIX');
  const [isFaturando, setIsFaturando] = useState(false);

  useEffect(() => {
    carregarOS();
  }, [id]);

  const carregarOS = async () => {
    try {
      const res = await djangoApi.get(`/operacional/os/${id}/`);
      // Simulação: também carregar o orçamento ativo dessa OS
      const resOrcamentos = await djangoApi.get(`/operacional/orcamento/?os=${id}&is_active=True`);
      const orcamentoAtivo = resOrcamentos.data.results?.[0] || resOrcamentos.data[0];
      
      let itens = [];
      if (orcamentoAtivo) {
        const resItens = await djangoApi.get(`/operacional/orcamento-item/?orcamento=${orcamentoAtivo.id}`);
        itens = resItens.data.results || resItens.data;
      }
      
      setOsData({
        ...res.data,
        orcamento: orcamentoAtivo,
        itens: itens
      });
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar os dados da OS. Verifique se a OS existe e possui itens.');
    } finally {
      setLoading(false);
    }
  };

  const handleFaturar = async () => {
    setIsFaturando(true);
    try {
      // 1. Atualiza a OS para CONCLUIDA / AGUARDANDO_FATURAMENTO no Backend
      // 2. Transfere para o Módulo Financeiro
      await djangoApi.post(`/operacional/os/${id}/concluir_e_faturar/`, {
        forma_pagamento: formaPagamento,
        valor_total: total
      });
      alert('OS Faturada e NFS-e emitida com sucesso!');
      navigate('/financeiro');
    } catch (err) {
      console.error(err);
      alert('Erro ao faturar a OS.');
    } finally {
      setIsFaturando(false);
    }
  };

  if (loading) return <DefaultLayout><div className="p-8 text-surface-400">Carregando dados da OS...</div></DefaultLayout>;
  if (!osData) return <DefaultLayout><div className="p-8 text-danger-400">OS não encontrada.</div></DefaultLayout>;

  const pecas = (osData.itens as unknown[])?.filter((i: unknown) => (i as Record<string, unknown>).produto) || [];
  const servicos = (osData.itens as unknown[])?.filter((i: unknown) => (i as Record<string, unknown>).servico) || [];
  const total = ((osData.orcamento as Record<string, unknown>)?.valor_total as number) || 0;

  return (
    <DefaultLayout>
      <div className="flex flex-col h-full gap-6">
        <PageHeader 
          title={`🧾 Fechamento de Ordem de Serviço #${osData.id}`} 
          subtitle="Consolidação e Faturamento (Emissão de NFS-e)" 
        />

        {/* Header Section */}
        <Card padding="md" className="bg-surface-800/50 border-surface-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-[10px] text-surface-500 font-bold uppercase tracking-widest mb-1">Cliente</p>
              <p className="text-sm font-semibold text-surface-100">{osData.veiculo_detalhes?.cliente_nome || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-surface-500 font-bold uppercase tracking-widest mb-1">Veículo</p>
              <p className="text-sm font-semibold text-surface-100">{osData.veiculo_detalhes?.placa || '—'} - {osData.veiculo_detalhes?.modelo || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-surface-500 font-bold uppercase tracking-widest mb-1">KM Atual</p>
              <p className="text-sm font-semibold text-surface-100">{osData.km_entrada} km</p>
            </div>
            <div>
              <p className="text-[10px] text-surface-500 font-bold uppercase tracking-widest mb-1">Status OS</p>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-accent-500/20 text-accent-400 border border-accent-500/30 uppercase tracking-wide">
                Aguardando Faturamento
              </span>
            </div>
          </div>
        </Card>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          
          <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
            {/* Tabela de Serviços */}
            <Card padding="md">
              <h3 className="text-sm font-bold text-surface-100 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="text-primary-500">🔧</span> Mão de Obra e Serviços
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-surface-700 text-surface-400">
                      <th className="pb-3 font-semibold w-12">#</th>
                      <th className="pb-3 font-semibold">Descrição</th>
                      <th className="pb-3 font-semibold text-right">Qtd (h)</th>
                      <th className="pb-3 font-semibold text-right">Valor Unit.</th>
                      <th className="pb-3 font-semibold text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-800">
                    {servicos.map((s: unknown, idx: number) => {
                      const item = s as { id: number, servico_detalhes?: { descricao: string }, quantidade: number, valor_estimado: number };
                      return (
                      <tr key={item.id} className="text-surface-200">
                        <td className="py-3 text-surface-500 font-mono text-xs">{idx + 1}</td>
                        <td className="py-3">{item.servico_detalhes?.descricao || 'Serviço'}</td>
                        <td className="py-3 text-right">{Number(item.quantidade).toFixed(1)}</td>
                        <td className="py-3 text-right text-surface-400">R$ {Number(item.valor_estimado).toFixed(2)}</td>
                        <td className="py-3 text-right font-medium">R$ {(Number(item.quantidade) * Number(item.valor_estimado)).toFixed(2)}</td>
                      </tr>
                    )})}
                    {servicos.length === 0 && (
                      <tr><td colSpan={5} className="py-4 text-center text-surface-500 text-xs">Nenhum serviço registrado</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Tabela de Peças */}
            <Card padding="md">
              <h3 className="text-sm font-bold text-surface-100 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="text-warning-500">📦</span> Peças Aplicadas
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-surface-700 text-surface-400">
                      <th className="pb-3 font-semibold w-12">#</th>
                      <th className="pb-3 font-semibold">Código/Descrição</th>
                      <th className="pb-3 font-semibold text-right">Qtd</th>
                      <th className="pb-3 font-semibold text-right">Valor Unit.</th>
                      <th className="pb-3 font-semibold text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-800">
                    {pecas.map((p: unknown, idx: number) => {
                      const item = p as { id: number, produto_detalhes?: { descricao: string, codigo: string }, quantidade: number, valor_estimado: number };
                      return (
                      <tr key={item.id} className="text-surface-200">
                        <td className="py-3 text-surface-500 font-mono text-xs">{idx + 1}</td>
                        <td className="py-3">
                          <span className="block">{item.produto_detalhes?.descricao || 'Peça'}</span>
                          <span className="text-[10px] text-surface-500">{item.produto_detalhes?.codigo || ''}</span>
                        </td>
                        <td className="py-3 text-right">{Number(item.quantidade)}</td>
                        <td className="py-3 text-right text-surface-400">R$ {Number(item.valor_estimado).toFixed(2)}</td>
                        <td className="py-3 text-right font-medium">R$ {(Number(item.quantidade) * Number(item.valor_estimado)).toFixed(2)}</td>
                      </tr>
                    )})}
                    {pecas.length === 0 && (
                      <tr><td colSpan={5} className="py-4 text-center text-surface-500 text-xs">Nenhuma peça registrada</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Sidebar de Faturamento */}
          <div className="lg:col-span-1">
            <Card padding="lg" className="sticky top-0 border-primary-500/30 bg-surface-900/80 shadow-2xl backdrop-blur">
              <h3 className="text-lg font-bold text-white mb-6">Resumo Financeiro</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-surface-300">
                  <span>Subtotal Serviços:</span>
                  <span className="font-mono">R$ {Number(servicos.reduce((acc: number, s: any) => { const item = s as { quantidade: number, valor_estimado: number }; return acc + (item.quantidade * item.valor_estimado); }, 0)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-surface-300">
                  <span>Subtotal Peças:</span>
                  <span className="font-mono">R$ {Number(pecas.reduce((acc: number, p: any) => { const item = p as { quantidade: number, valor_estimado: number }; return acc + (item.quantidade * item.valor_estimado); }, 0)).toFixed(2)}</span>
                </div>
                <div className="h-px bg-surface-700 w-full my-2"></div>
                <div className="flex justify-between items-center text-white">
                  <span className="text-sm font-bold uppercase tracking-wider text-surface-400">Total a Pagar:</span>
                  <span className="text-3xl font-black text-primary-400">R$ {Number(total).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-bold text-surface-400 uppercase tracking-widest mb-2">Forma de Pagamento</label>
                  <select 
                    value={formaPagamento}
                    onChange={(e) => setFormaPagamento(e.target.value)}
                    className="w-full bg-surface-950 border border-surface-700 rounded-xl px-4 py-3 text-sm text-surface-100 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                  >
                    <option value="PIX">PIX (Transferência Imediata)</option>
                    <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                    <option value="CARTAO_DEBITO">Cartão de Débito</option>
                    <option value="DINHEIRO">Dinheiro (Espécie)</option>
                    <option value="BOLETO">Boleto Bancário</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={handleFaturar}
                disabled={isFaturando || (servicos.length === 0 && pecas.length === 0)}
                className="w-full bg-primary-600 hover:bg-primary-500 disabled:bg-surface-700 disabled:text-surface-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] disabled:shadow-none flex items-center justify-center gap-2"
              >
                {isFaturando ? (
                  <span className="animate-pulse">PROCESSANDO...</span>
                ) : (
                  <>
                    <span>📄</span>
                    <span>CONCLUIR E EMITIR NFS-E</span>
                  </>
                )}
              </button>
              
              <p className="text-center text-[10px] text-surface-500 mt-4 max-w-xs mx-auto">
                Ao concluir, a OS será encerrada e um título a receber será gerado no módulo Financeiro.
              </p>
            </Card>
          </div>

        </div>
      </div>
    </DefaultLayout>
  );
}
