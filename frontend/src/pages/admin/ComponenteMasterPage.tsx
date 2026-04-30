import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useComponenteStore } from '../../store/useComponenteStore';
import DefaultLayout from '../../layouts/DefaultLayout';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

export default function ComponenteMasterPage() {
  const navigate = useNavigate();
  const { 
    componenteAtual, 
    listaComponentes, 
    isLoading, 
    isSaving,
    error,
    carregarComponentes, 
    atualizarCampo, 
    selecionarComponente, 
    salvarComponente,
    excluirComponente,
    resetForm
  } = useComponenteStore();

  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [newType, setNewType] = useState('');
  const [tiposExtras, setTiposExtras] = useState<string[]>([]);

  useEffect(() => {
    carregarComponentes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    await salvarComponente();
  };

  const StockBadge = (props: ICellRendererParams) => {
    const value = props.value || 0;
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${value > 0 ? 'bg-accent-500/10 text-accent-400' : 'bg-danger-500/10 text-danger-400'}`}>
        {value}
      </span>
    );
  };

  const ActionButton = (props: ICellRendererParams) => {
    return (
      <button
        type="button"
        onClick={() => selecionarComponente(props.data.id)}
        className="text-primary-400 hover:text-primary-300 font-medium text-xs"
      >
        Selecionar
      </button>
    );
  };

  const columnDefs = useMemo<ColDef[]>(() => [
    { field: 'codigo_interno', headerName: 'SKU', width: 130, cellClass: 'font-mono text-primary-400' },
    { field: 'descricao_generica', headerName: 'Descrição', flex: 1 },
    { field: 'estoque_atual', headerName: 'Estoque', width: 100, cellRenderer: StockBadge, cellClass: 'text-center' },
    { 
      field: 'preco_venda', 
      headerName: 'Preço', 
      width: 120, 
      valueFormatter: (p) => `R$ ${Number(p.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      cellClass: 'text-right font-medium'
    },
    { headerName: 'Ação', width: 100, cellRenderer: ActionButton, cellClass: 'text-center', sortable: false, filter: false }
  ], []);

  const defaultColDef = useMemo(() => ({ sortable: true, filter: true, resizable: true }), []);

  return (
    <DefaultLayout>
      <div className="p-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-100 flex items-center gap-3">
            Catálogo de Componentes
            {componenteAtual.codigo_interno && (
              <span className="px-3 py-1 bg-surface-800 text-primary-400 rounded-md text-xl border border-surface-700">
                {componenteAtual.codigo_interno}
              </span>
            )}
          </h1>
          <p className="text-surface-400 mt-1">Gestão central de estoque, equivalências e motorização</p>
        </div>
        
        <div className="flex items-center gap-3">
          {componenteAtual.id && (
            <button 
              type="button"
              onClick={() => navigate(`/admin/componentes/${componenteAtual.id}/referencias`)}
              className="px-4 py-2 bg-accent-500/10 text-accent-400 border border-accent-500/30 rounded-lg text-sm font-semibold hover:bg-accent-500/20 transition-colors flex items-center gap-2"
            >
              📦 Gerenciar Referências (Produtos)
            </button>
          )}
          <button 
            type="button"
            onClick={resetForm}
            className="px-4 py-2 bg-surface-800 text-surface-200 rounded-lg text-sm font-medium hover:bg-surface-700 transition-colors border border-surface-700"
          >
            Novo Componente
          </button>
          {componenteAtual.id && (
            <button 
                type="button"
                onClick={() => {
                    if (window.confirm('Tem certeza que deseja excluir este componente?')) {
                        excluirComponente(componenteAtual.id!);
                    }
                }}
                className="px-4 py-2 bg-danger-500/20 text-danger-400 border border-danger-500/30 rounded-lg text-sm font-semibold hover:bg-danger-500/30 transition-colors"
            >
                Excluir
            </button>
          )}
          <button 
            type="submit"
            form="componente-form"
            disabled={isSaving}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(99,102,241,0.4)]"
          >
            {isSaving ? 'Salvando...' : 'Salvar Componente'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-danger-500/20 border border-danger-500/30 rounded-lg text-danger-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-8">
        
        {/* Coluna Principal: Formulário (2/3) */}
        <div className="col-span-2 space-y-8">
          <form id="componente-form" onSubmit={handleSalvar} className="space-y-8">
            
            {/* Seção 1: Identificação */}
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-surface-100 mb-5 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary-500/20 text-primary-400 flex items-center justify-center text-sm">
                  1
                </span>
                Identificação do Componente
              </h2>
              
              <div className="grid grid-cols-12 gap-5">
                <div className="col-span-4">
                  <label className="block text-sm font-medium text-surface-400 mb-2">Código Interno (SKU) *</label>
                  <input 
                    type="text" 
                    required
                    value={componenteAtual.codigo_interno}
                    onChange={(e) => atualizarCampo('codigo_interno', e.target.value)}
                    className="w-full bg-surface-800 border border-surface-700 text-surface-100 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 uppercase"
                    placeholder="Ex: RET-VAL-001"
                  />
                </div>
                
                <div className="col-span-4">
                  <label className="block text-sm font-medium text-surface-400 mb-2 text-primary-400">Tipo *</label>
                  <div className="flex gap-2">
                    <select 
                      required
                      value={componenteAtual.tipo_componente}
                      onChange={(e) => atualizarCampo('tipo_componente', e.target.value)}
                      className="flex-1 bg-surface-800 border border-surface-700 text-surface-100 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="RETENTOR">Retentor</option>
                      <option value="JUNTA">Junta</option>
                      <option value="FILTRO">Filtro</option>
                      <option value="CORREIA">Correia</option>
                      <option value="OLEO">Óleo</option>
                      {tiposExtras.map(t => (
                        <option key={t} value={t.toUpperCase()}>{t}</option>
                      ))}
                      <option value="OUTRO">Outro</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsTypeModalOpen(true)}
                      className="px-3 bg-surface-800 border border-surface-700 text-primary-400 rounded-lg hover:bg-surface-700 transition-colors font-bold text-lg"
                      title="Adicionar Novo Tipo"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="col-span-4">
                  <label className="block text-sm font-medium text-surface-400 mb-2">Medidas Técnicas</label>
                  <input 
                    type="text" 
                    value={componenteAtual.medidas_tecnicas}
                    onChange={(e) => atualizarCampo('medidas_tecnicas', e.target.value)}
                    className="w-full bg-surface-800 border border-surface-700 text-surface-100 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    placeholder="Ex: 8,00x10,90x10,00"
                  />
                </div>

                <div className="col-span-12">
                  <label className="block text-sm font-medium text-surface-400 mb-2">Descrição Genérica *</label>
                  <input 
                    type="text" 
                    required
                    value={componenteAtual.descricao_generica}
                    onChange={(e) => atualizarCampo('descricao_generica', e.target.value)}
                    className="w-full bg-surface-800 border border-surface-700 text-surface-100 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    placeholder="Ex: Retentor Haste de Válvula AP"
                  />
                </div>
              </div>
            </div>

            {/* Seção 2: Estoque e Precificação */}
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-surface-100 mb-5 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary-500/20 text-primary-400 flex items-center justify-center text-sm">
                  2
                </span>
                Estoque e Precificação
              </h2>
              
              <div className="grid grid-cols-12 gap-5">
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-surface-400 mb-2">Unidade</label>
                  <input 
                    type="text" 
                    value={componenteAtual.unidade}
                    onChange={(e) => atualizarCampo('unidade', e.target.value.toUpperCase())}
                    className="w-full bg-surface-800 border border-surface-700 text-surface-100 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-sm font-medium text-surface-400 mb-2">Estoque Atual</label>
                  <input 
                    type="number" 
                    value={componenteAtual.estoque_atual}
                    onChange={(e) => atualizarCampo('estoque_atual', e.target.value)}
                    className="w-full bg-surface-800 border border-surface-700 text-surface-100 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-sm font-medium text-surface-400 mb-2">Custo Médio (R$)</label>
                  <input 
                    type="number"
                    step="0.01" 
                    value={componenteAtual.custo_medio_ponderado}
                    onChange={(e) => atualizarCampo('custo_medio_ponderado', e.target.value)}
                    className="w-full bg-surface-800 border border-surface-700 text-surface-100 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-opacity-50"
                    disabled // Deve ser atualizado via NFe
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-sm font-medium text-surface-400 mb-2">Preço de Venda (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={componenteAtual.preco_venda}
                    onChange={(e) => atualizarCampo('preco_venda', e.target.value)}
                    className="w-full bg-surface-800 border border-surface-700 text-surface-100 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Seção 3: Produtos Similares */}
            {componenteAtual.id && (
              <div className="bg-surface-900 border border-surface-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-surface-100 mb-5 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-primary-500/20 text-primary-400 flex items-center justify-center text-sm">
                    3
                  </span>
                  Produtos Similares / Equivalentes (Mesmas Medidas)
                </h2>
                
                <div className="ag-theme-alpine-dark w-full h-[300px]">
                  <AgGridReact
                    rowData={componenteAtual.similares || []}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    overlayNoRowsTemplate="Nenhum produto similar encontrado com estas especificações técnicas."
                  />
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Coluna Lateral: Busca e Equivalências (1/3) */}
        <div className="col-span-1 space-y-6">
          <div className="bg-surface-900 border border-surface-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-surface-100 uppercase tracking-wider mb-4">
              Componentes Cadastrados
            </h3>
            
            <div className="relative mb-4">
              <input 
                type="text" 
                placeholder="Buscar por código ou descrição..." 
                className="w-full bg-surface-800 border border-surface-700 text-surface-100 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm"
              />
              <span className="absolute left-3 top-2.5 text-surface-400">
                🔍
              </span>
            </div>

            {isLoading ? (
                <div className="text-center py-8 text-surface-400">Carregando...</div>
            ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {listaComponentes.map(comp => (
                    <div 
                    key={comp.id}
                    onClick={() => selecionarComponente(comp.id!)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        componenteAtual.id === comp.id 
                        ? 'bg-primary-900/20 border-primary-500/50' 
                        : 'bg-surface-800 border-surface-700 hover:border-surface-600'
                    }`}
                    >
                    <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-surface-100 text-sm">{comp.codigo_interno}</span>
                        <span className="text-xs bg-surface-700 text-surface-300 px-2 py-0.5 rounded">
                        {comp.estoque_atual} {comp.unidade}
                        </span>
                    </div>
                    <div className="text-xs text-surface-400 truncate">
                        {comp.descricao_generica}
                    </div>
                    </div>
                ))}
                </div>
            )}
          </div>
        </div>

      </div>

      {/* Modal para Novo Tipo */}
      {isTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-900 border border-surface-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-surface-50 mb-4">✨ Cadastrar Novo Tipo</h3>
            <p className="text-xs text-surface-500 mb-6 uppercase tracking-wider">Defina uma nova categoria para o catálogo</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-surface-500 uppercase mb-1">Nome do Tipo</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (newType) {
                        setTiposExtras(prev => [...prev, newType]);
                        atualizarCampo('tipo_componente', newType.toUpperCase());
                        setNewType('');
                        setIsTypeModalOpen(false);
                      }
                    }
                  }}
                  className="w-full bg-surface-950 border border-surface-700 text-surface-100 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary-500"
                  placeholder="Ex: AMORTECEDOR"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setIsTypeModalOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-surface-800 text-surface-300 text-sm font-semibold hover:bg-surface-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  disabled={!newType}
                  onClick={() => {
                    setTiposExtras(prev => [...prev, newType]);
                    atualizarCampo('tipo_componente', newType.toUpperCase());
                    setNewType('');
                    setIsTypeModalOpen(false);
                  }}
                  className="flex-1 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-500 transition-colors shadow-lg shadow-primary-500/20 disabled:opacity-50"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </DefaultLayout>
  );
}
