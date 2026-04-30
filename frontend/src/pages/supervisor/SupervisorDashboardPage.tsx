import { useState, useMemo } from 'react';
import DefaultLayout from '../../layouts/DefaultLayout';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';
import { useAgendaStore } from '../../store/useAgendaStore';
import { useComponenteStore } from '../../store/useComponenteStore';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

ModuleRegistry.registerModules([AllCommunityModule]);

export default function SupervisorDashboardPage() {
  const [activeTab, setActiveTab] = useState<'aprovacoes' | 'agenda' | 'cadastros' | 'suprimentos'>('aprovacoes');
  const { boxes, alocarBox, atualizarStatus } = useAgendaStore();
  const { listaComponentes, carregarComponentes } = useComponenteStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDiagOpen, setIsDiagOpen] = useState(false);
  const [selectedOS, setSelectedOS] = useState<{os: number, cliente: string, veiculo: string} | null>(null);

  // Diagnóstico State
  const [servicos, setServicos] = useState<{desc: string, horas: number, valor: number}[]>([]);
  const [pecas, setPecas] = useState<{id: number, desc: string, qtd: number, valor: number, estoque: number}[]>([]);

  useState(() => {
    carregarComponentes();
  });

  const totalDiag = useMemo(() => {
    const s = servicos.reduce((acc, curr) => acc + curr.valor, 0);
    const p = pecas.reduce((acc, curr) => acc + (curr.valor * curr.qtd), 0);
    return s + p;
  }, [servicos, pecas]);

  const defaultColDef = useMemo(() => ({ sortable: true, filter: true, resizable: true }), []);

  const tabs = [
    { key: 'aprovacoes', label: '⚠️ Aprovações', count: 2 },
    { key: 'agenda', label: '📅 Agenda', count: null },
    { key: 'cadastros', label: '📦 Cadastros', count: null },
    { key: 'suprimentos', label: '🚚 Suprimentos', count: 3 },
  ] as const;

  const handleApproveClick = (os: number, cliente: string, veiculo: string) => {
    setSelectedOS({ os, cliente, veiculo });
    setIsModalOpen(true);
  };

  const handleDiagClick = (os: number, cliente: string, veiculo: string) => {
    setSelectedOS({ os, cliente, veiculo });
    setIsDiagOpen(true);
    // Mock inicial caso esteja vazio
    if (servicos.length === 0) {
      setServicos([{ desc: 'Diagnóstico Eletrônico Avançado', horas: 1.5, valor: 220 }]);
    }
  };

  const addPeca = (comp: any) => {
    setPecas(prev => [...prev, { 
      id: comp.id, 
      desc: comp.descricao_generica, 
      qtd: 1, 
      valor: Number(comp.preco_venda),
      estoque: Number(comp.estoque_atual)
    }]);
  };

  const confirmAllocation = (boxName: string) => {
    if (selectedOS) {
      alocarBox(boxName, selectedOS.os.toString(), selectedOS.veiculo);
      setIsModalOpen(false);
      setSelectedOS(null);
      setActiveTab('agenda');
      alert(`OS #${selectedOS.os} aprovada e alocada no ${boxName}`);
    }
  };

  return (
    <DefaultLayout>
      <div className="p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-surface-50">📋 Painel do Supervisor</h1>
          <p className="text-sm text-surface-500 mt-1">Aprovações, Alocação, Cadastros e Suprimentos</p>
        </header>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-surface-900 border border-surface-700 rounded-xl p-1 w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === t.key
                  ? 'bg-primary-600 text-white'
                  : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
              }`}
            >
              {t.label}
              {t.count !== null && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === t.key ? 'bg-white/20' : 'bg-danger-500/20 text-danger-400'
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

          <div className="space-y-8">
            {/* Fila de Aprovações */}
            <div className="bg-surface-900 border border-surface-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
                <span className="text-danger-500">⚠️</span> Fila de Aprovações (RF-OP-06/07)
              </h2>
              <div className="space-y-3">
                {[
                  { os: 104, cliente: 'Transportadora Norte', veiculo: 'SCANIA R450 - JKL-5566', variacao: 22, limite: 15, valor: 12500, motivo: 'Cabeçote com trinca não prevista' },
                  { os: 107, cliente: 'Maria Souza', veiculo: 'FIAT ARGO - DEF-8899', variacao: 18, limite: 15, valor: 3200, motivo: 'Bomba d\'água + correia (extra pós-desmontagem)' },
                ].map((item) => (
                  <div key={item.os} className="p-4 rounded-xl border border-danger-500/20 bg-danger-500/5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-surface-100">OS #{item.os} — {item.cliente}</p>
                        <p className="text-xs text-primary-400 font-medium">{item.veiculo}</p>
                        <p className="text-xs text-surface-500 mt-0.5">{item.motivo}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-danger-500/20 text-danger-400 font-medium">
                        +{item.variacao}% (limite: {item.limite}%)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleApproveClick(item.os, item.cliente, item.veiculo)}
                        className="px-4 py-1.5 rounded-lg bg-accent-600 text-white text-xs font-medium hover:bg-accent-500 transition-colors"
                      >
                        ✓ Aprovar
                      </button>
                      <button 
                        onClick={() => handleDiagClick(item.os, item.cliente, item.veiculo)}
                        className="px-4 py-1.5 rounded-lg bg-surface-700 text-surface-300 text-xs font-medium hover:bg-surface-600 transition-colors"
                      >
                        🔍 Abrir Diagnóstico
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Serviços em Execução */}
            <div className="bg-surface-900 border border-surface-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
                <span className="text-primary-500">⚡</span> Serviços em Execução (Oficina)
              </h2>
              <div className="space-y-3">
                {boxes.filter(b => b.os !== '').map((box) => (
                  <div key={box.box} className="p-4 rounded-xl border border-surface-700 bg-surface-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-surface-700 flex items-center justify-center text-xl">
                        {box.box.toLowerCase().includes('rampa') ? '⚖️' : '🔧'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-surface-100">OS #{box.os} — {box.veiculo}</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-400 font-bold uppercase">{box.box}</span>
                        </div>
                        <p className="text-xs text-surface-500 mt-0.5">Colaborador: {box.mecanico}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleDiagClick(parseInt(box.os), '—', box.veiculo)}
                        className="text-xs text-primary-400 hover:text-primary-300 font-bold px-3 py-1.5 rounded-lg border border-primary-500/30 hover:bg-primary-500/5 transition-all"
                      >
                        📋 Detalhes Diagnóstico
                      </button>
                      <div className="text-right">
                        <p className="text-[10px] text-surface-500 uppercase font-bold mb-1">Status Atual</p>
                        <select 
                          value={box.status}
                          onChange={(e) => {
                            atualizarStatus(box.box, e.target.value as any);
                          }}
                          className={`text-xs font-bold rounded-lg px-3 py-1.5 border focus:outline-none transition-colors ${
                            box.status === 'Em Execução' ? 'bg-accent-500/10 border-accent-500/30 text-accent-400' : 
                            box.status === 'Diagnóstico' ? 'bg-warning-500/10 border-warning-500/30 text-warning-400' :
                            'bg-primary-500/10 border-primary-500/30 text-primary-400'
                          }`}
                        >
                          <option value="Diagnóstico">Diagnóstico</option>
                          <option value="Em Execução">Em Execução</option>
                          <option value="Em Manutenção">Em Manutenção</option>
                          <option value="Disponível">Finalizar (Liberar Box)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                {boxes.filter(b => b.os !== '').length === 0 && (
                  <div className="py-8 text-center border border-dashed border-surface-700 rounded-xl opacity-50">
                    <p className="text-sm text-surface-500">Nenhum serviço em execução no momento.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        {activeTab === 'agenda' && (
          <div className="bg-surface-900 border border-surface-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-surface-100 mb-4">Agenda de Alocação (RF-OP-09)</h2>
            <div className="ag-theme-alpine-dark w-full" style={{ height: '350px' }}>
              <AgGridReact
                rowData={boxes}
                columnDefs={[
                  { field: 'box', headerName: 'Recurso', width: 120 },
                  { field: 'os', headerName: 'OS #', width: 80, cellClass: 'text-primary-400 font-bold' },
                  { field: 'veiculo', headerName: 'Veículo', width: 200 },
                  { field: 'mecanico', headerName: 'Colaborador', flex: 1 },
                  { field: 'inicio', headerName: 'Início', width: 100 },
                  { field: 'fim', headerName: 'Fim', width: 100 },
                  { 
                    field: 'status', 
                    headerName: 'Status', 
                    width: 150,
                    cellRenderer: (p: any) => (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.value === 'Disponível' ? 'bg-accent-500/10 text-accent-400' : 'bg-primary-500/10 text-primary-400'
                      }`}>
                        {p.value}
                      </span>
                    )
                  },
                ] as ColDef[]}
                defaultColDef={defaultColDef}
              />
            </div>
          </div>
        )}

        {/* Modal de Alocação */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-surface-900 border border-surface-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-surface-700 flex justify-between items-center bg-surface-800/50">
                <div>
                  <h3 className="text-xl font-bold text-surface-100">Alocar Box</h3>
                  <p className="text-xs text-primary-400 font-bold mt-1 uppercase">{selectedOS?.veiculo}</p>
                  <p className="text-[10px] text-surface-400 uppercase tracking-wider">OS #{selectedOS?.os} — {selectedOS?.cliente}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-surface-400 hover:text-surface-200">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6 space-y-3">
                <p className="text-sm text-surface-300 mb-4">Selecione um recurso disponível para iniciar o serviço:</p>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {boxes.map((b) => {
                    const isDisponivel = b.status === 'Disponível';
                    return (
                      <button
                        key={b.box}
                        disabled={!isDisponivel}
                        onClick={() => confirmAllocation(b.box)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                          isDisponivel
                            ? 'border-surface-700 hover:border-primary-500 bg-surface-800 hover:bg-surface-700'
                            : 'border-danger-500/30 bg-danger-500/5 opacity-80 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-xl ${!isDisponivel ? 'grayscale' : ''}`}>
                            {b.box.toLowerCase().includes('rampa') ? '⚖️' : '🔧'}
                          </span>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-surface-100">{b.box}</p>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-black uppercase ${
                                isDisponivel ? 'bg-accent-500/20 text-accent-400' : 'bg-danger-500/20 text-danger-400'
                              }`}>
                                {isDisponivel ? 'Livre' : 'Ocupado'}
                              </span>
                            </div>
                            <p className="text-xs text-surface-500">
                              {isDisponivel ? 'Pronto para uso' : `${b.veiculo} (OS #${b.os})`}
                            </p>
                          </div>
                        </div>
                        {isDisponivel && (
                          <span className="bg-primary-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg">
                            Alocar
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Diagnóstico */}
        {isDiagOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-surface-900 border border-surface-700 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-surface-700 flex justify-between items-center bg-surface-800/50">
                <div>
                  <h3 className="text-xl font-bold text-surface-100 flex items-center gap-2">
                    🔍 Diagnóstico Técnico — OS #{selectedOS?.os}
                  </h3>
                  <p className="text-sm text-primary-400 font-medium mt-1">{selectedOS?.veiculo}</p>
                </div>
                <button onClick={() => setIsDiagOpen(false)} className="p-2 hover:bg-surface-700 rounded-full transition-colors">
                  <svg className="w-6 h-6 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-0">
                {/* Serviços e Peças */}
                <div className="lg:col-span-2 p-6 overflow-y-auto space-y-6 border-r border-surface-700">
                  {/* Serviços */}
                  <section>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-bold text-surface-400 uppercase tracking-wider">🛠️ Serviços / Mão de Obra</h4>
                      <button className="text-xs text-primary-400 font-bold hover:underline">+ Adicionar Serviço</button>
                    </div>
                    <div className="space-y-2">
                      {servicos.map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-surface-800 rounded-lg border border-surface-700">
                          <span className="text-sm text-surface-100">{s.desc} ({s.horas}h)</span>
                          <span className="text-sm font-bold text-surface-100">R$ {s.valor.toLocaleString('pt-BR')}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Peças */}
                  <section>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-bold text-surface-400 uppercase tracking-wider">🔩 Peças e Insumos</h4>
                      <p className="text-[10px] text-surface-500 italic">Pesquise no catálogo ao lado para adicionar</p>
                    </div>
                    <div className="space-y-2">
                      {pecas.map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-surface-800 rounded-lg border border-surface-700">
                          <div className="flex-1">
                            <p className="text-sm text-surface-100">{p.desc}</p>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] text-surface-500">Qtd: {p.qtd} • Unit: R$ {p.valor.toLocaleString('pt-BR')}</span>
                                <span className={`text-[10px] font-bold ${p.estoque > 0 ? 'text-green-500' : 'text-danger-500'}`}>
                                    Estoque: {p.estoque}
                                </span>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-surface-100">R$ {(p.valor * p.qtd).toLocaleString('pt-BR')}</span>
                        </div>
                      ))}
                      {pecas.length === 0 && (
                        <div className="p-8 text-center border border-dashed border-surface-700 rounded-xl opacity-30">
                          <p className="text-xs">Nenhuma peça adicionada. Pesquise no catálogo ao lado.</p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                {/* Catálogo de Peças (Sidebar) */}
                <div className="bg-surface-950 p-6 overflow-y-auto flex flex-col">
                  <h4 className="text-sm font-bold text-surface-400 uppercase tracking-wider mb-4">📦 Pesquisa de Estoque</h4>
                  <div className="relative mb-4">
                    <input 
                      type="text" 
                      placeholder="Buscar componente..."
                      className="w-full bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-xs text-surface-100 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                    {listaComponentes.slice(0, 15).map((comp) => (
                      <button 
                        key={comp.id}
                        onClick={() => addPeca(comp)}
                        className="w-full text-left p-2 rounded-lg bg-surface-900 border border-surface-800 hover:border-primary-500/50 transition-all group"
                      >
                        <p className="text-xs font-bold text-surface-100 group-hover:text-primary-400 transition-colors truncate">{comp.descricao_generica}</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className={`text-[10px] ${Number(comp.estoque_atual) > 0 ? 'text-surface-500' : 'text-danger-500'}`}>
                            Estoque: {comp.estoque_atual}
                          </span>
                          <span className="text-[10px] font-bold text-accent-400">R$ {Number(comp.preco_venda).toLocaleString('pt-BR')}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-surface-700">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs text-surface-400 uppercase font-bold">Total Orçamento</span>
                      <span className="text-xl font-black text-white">R$ {totalDiag.toLocaleString('pt-BR')}</span>
                    </div>
                    <button 
                      onClick={() => {
                        setIsDiagOpen(false);
                        handleApproveClick(selectedOS!.os, selectedOS!.cliente, selectedOS!.veiculo);
                      }}
                      className="w-full py-3 bg-accent-600 hover:bg-accent-500 text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-xl shadow-accent-500/20 transition-all"
                    >
                      Aprovar Diagnóstico
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ... manter demais abas cadastros e suprimentos ... */}
        {activeTab === 'cadastros' && (
          <div className="bg-surface-900 border border-surface-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-surface-100 mb-4">Central de Cadastros (RF-OP-08)</h2>
            <div className="ag-theme-alpine-dark w-full" style={{ height: '350px' }}>
              <AgGridReact
                rowData={[
                  { sku: 'PC-001', descricao: 'Pastilha de Freio Dianteira', custo: 45.90, estoque: 24, jit: false },
                  { sku: 'PC-002', descricao: 'Filtro de Óleo Motor', custo: 28.50, estoque: 42, jit: false },
                  { sku: 'PC-003', descricao: 'Cabeçote Retificado', custo: 1200.00, estoque: 0, jit: true },
                  { sku: 'PC-004', descricao: 'Bomba d\'Água Universal', custo: 185.00, estoque: 6, jit: false },
                  { sku: 'LB-001', descricao: 'Óleo 5W30 Sintético (1L)', custo: 32.00, estoque: 80, jit: false },
                ]}
                columnDefs={[
                  { field: 'sku', headerName: 'SKU', width: 110 },
                  { field: 'descricao', headerName: 'Descrição', flex: 1 },
                  { field: 'custo', headerName: 'Custo Médio', width: 120 },
                  { field: 'estoque', headerName: 'Estoque', width: 100 },
                  { field: 'jit', headerName: 'JIT?', width: 80 },
                ] as ColDef[]}
                defaultColDef={defaultColDef}
              />
            </div>
          </div>
        )}

        {activeTab === 'suprimentos' && (
          <div className="bg-surface-900 border border-surface-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-surface-100 mb-4">Central de Suprimentos — JIT (RF-SUP-03)</h2>
            <div className="space-y-3">
              {[
                { fornecedor: 'AutoParts Ltda', itens: 3, total: 1680, lead: '2 dias', status: 'Pendente' },
                { fornecedor: 'Retífica Central', itens: 1, total: 1200, lead: '5 dias', status: 'Em Trânsito' },
                { fornecedor: 'Lubrax Distribuição', itens: 2, total: 480, lead: '1 dia', status: 'Pendente' },
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-surface-700 hover:border-primary-500/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-surface-200">{p.fornecedor}</p>
                    <p className="text-xs text-surface-500">{p.itens} itens • Lead: {p.lead}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-surface-100">R$ {p.total.toLocaleString('pt-BR')}</p>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      p.status === 'Pendente' ? 'bg-warning-400/10 text-warning-400' : 'bg-accent-500/10 text-accent-400'
                    }`}>{p.status}</span>
                    {p.status === 'Pendente' && (
                      <button className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-medium hover:bg-primary-500 transition-colors">
                        Liberar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
}
