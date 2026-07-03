import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useComponenteStore } from '../../store/useComponenteStore';
import DefaultLayout from '../../layouts/DefaultLayout';
import Card from '../../components/shared/Card';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';

// Import mandatory styles for AG Grid
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [localizacoes, setLocalizacoes] = useState<any[]>([]);

  useEffect(() => {
    carregarComponentes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (componenteAtual.id) {
      fetch(`/api/django/api/suprimentos/localizacao/?componente=${componenteAtual.id}`)
        .then(r => r.json())
        .then(data => setLocalizacoes(data.results || []))
        .catch(() => setLocalizacoes([]));
    } else {
      setLocalizacoes([]);
    }
  }, [componenteAtual.id]);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    await salvarComponente();
  };

  const columnDefsVeiculos = useMemo<ColDef[]>(() => [
    { field: 'marca_nome', headerName: 'Marca', width: 120 },
    { field: 'modelo_nome', headerName: 'Modelo', flex: 1 },
    { field: 'versao_nome', headerName: 'Versão', flex: 2 },
    { field: 'observacoes', headerName: 'Observações', flex: 1 },
  ], []);

  const columnDefsReferencias = useMemo<ColDef[]>(() => [
    { field: 'marca_nome', headerName: 'Marca / Fabricante', flex: 1 },
    { field: 'codigo_fabricante', headerName: 'Código do Produto', flex: 1, cellClass: 'font-mono text-primary-400' },
    { field: 'material_construcao', headerName: 'Material', width: 150 }
  ], []);

  const columnDefsLocalizacoes = useMemo<ColDef[]>(() => [
    { field: 'fileira', headerName: 'Fileira', width: 90 },
    {
      field: 'lado', headerName: 'Lado', width: 80,
      cellRenderer: (p: any) => (
        <span className={p.value === 'D' ? 'text-blue-400 font-bold' : 'text-amber-400 font-bold'}>
          {p.value === 'D' ? 'Dir' : 'Esq'}
        </span>
      ),
    },
    { field: 'nivel', headerName: 'Nível', width: 80 },
    { field: 'bloco', headerName: 'Bloco', width: 90 },
    { field: 'codigo', headerName: 'Código', width: 130, cellClass: 'font-mono text-primary-400 font-bold' },
    { field: 'quantidade', headerName: 'Qtd', width: 70, cellClass: 'text-center font-bold' },
    { field: 'capacidade', headerName: 'Cap.', width: 70, cellClass: 'text-center' },
  ], []);

  const defaultColDef = useMemo(() => ({ sortable: true, filter: true, resizable: true }), []);

  const filteredLista = useMemo(() => {
    if (!searchTerm) return listaComponentes;
    const term = searchTerm.toLowerCase();
    return listaComponentes.filter(c => 
      c.codigo_interno.toLowerCase().includes(term) || 
      c.descricao_generica.toLowerCase().includes(term)
    );
  }, [listaComponentes, searchTerm]);

  const getCodigoPreview = () => {
    if (componenteAtual.id) return componenteAtual.codigo_interno;
    const tipo = (componenteAtual.tipo_componente || 'OUT').substring(0, 3).toUpperCase();
    const medidas = (componenteAtual.medidas_tecnicas || '').trim();
    const medidasSuf = medidas.length >= 6 ? medidas.slice(-6) : medidas.padStart(6, '0');
    return `${tipo}-XXX-${medidasSuf}`;
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna Principal: Formulário (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {isLoading ? (
            <Card padding="md" className="border-surface-800 p-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mb-4"></div>
              <p className="text-surface-400 animate-pulse">Carregando dados do componente...</p>
            </Card>
          ) : (
            <form id="componente-form" onSubmit={handleSalvar} className="space-y-8">
            
            {/* Seção 1: Identificação */}
            <Card padding="md" className="border-surface-800">
              <h2 className="text-lg font-semibold text-surface-100 mb-5 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary-500/20 text-primary-400 flex items-center justify-center text-sm">
                  1
                </span>
                Identificação do Componente
              </h2>
              
              <div className="grid grid-cols-12 gap-5">
                <div className="col-span-4">
                  <label className="block text-sm font-medium text-surface-400 mb-2">Código Interno (SKU)</label>
                  <input 
                    type="text" 
                    readOnly
                    value={getCodigoPreview()}
                    className="w-full bg-surface-900 border border-surface-700 text-surface-400 rounded-lg px-4 py-2.5 font-mono uppercase cursor-not-allowed"
                    title="Código gerado automaticamente no salvamento: TIPO-SEQ-MEDIDAS"
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
            </Card>

            {/* Seção 2: Estoque e Precificação */}
            <Card padding="md" className="border-surface-800">
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
                    value={componenteAtual.estoque_atual ?? 0}
                    onChange={(e) => atualizarCampo('estoque_atual', e.target.value)}
                    className="w-full bg-surface-800 border border-surface-700 text-surface-100 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-sm font-medium text-surface-400 mb-2">Custo Médio (R$)</label>
                  <input 
                    type="number"
                    step="0.01" 
                    value={componenteAtual.custo_medio_ponderado ?? 0}
                    onChange={(e) => atualizarCampo('custo_medio_ponderado', e.target.value)}
                    className="w-full bg-surface-800 border border-surface-700 text-surface-100 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-sm font-medium text-surface-400 mb-2">Preço de Venda (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={componenteAtual.preco_venda ?? 0}
                    onChange={(e) => atualizarCampo('preco_venda', e.target.value)}
                    className="w-full bg-surface-800 border border-surface-700 text-surface-100 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>
            </Card>
            
            {/* Seção 3: Produtos Similares */}
            {componenteAtual.id && (
              <Card padding="md" className="border-surface-800">
                <h2 className="text-lg font-semibold text-surface-100 mb-5 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-primary-500/20 text-primary-400 flex items-center justify-center text-sm">
                    3
                  </span>
                  Produtos Similares / Equivalentes (Mesmas Medidas)
                </h2>
                
                <div className="ag-theme-alpine-dark w-full h-[300px]">
                  <AgGridReact
                    rowData={componenteAtual.similares || []}
                    columnDefs={columnDefsReferencias}
                    defaultColDef={defaultColDef}
                    overlayNoRowsTemplate="Nenhum produto similar encontrado com estas especificações técnicas."
                  />
                </div>
              </Card>
            )}

            {/* Seção 4: Veículos Compatíveis */}
            {componenteAtual.id && (
              <Card padding="md" className="border-surface-800">
                <h2 className="text-lg font-semibold text-surface-100 mb-5 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-primary-500/20 text-primary-400 flex items-center justify-center text-sm">
                    4
                  </span>
                  Veículos Compatíveis
                </h2>
                
                <div className="ag-theme-alpine-dark w-full h-[250px]">
                  <AgGridReact
                    rowData={componenteAtual.veiculos_compativeis || []}
                    columnDefs={columnDefsVeiculos}
                    defaultColDef={defaultColDef}
                    overlayNoRowsTemplate="Nenhum veículo compatível cadastrado para este componente."
                  />
                </div>
              </Card>
            )}

            {/* Seção 5: Localizações no Depósito */}
            {componenteAtual.id && (
              <Card padding="md" className="border-surface-800">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-surface-100 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-primary-500/20 text-primary-400 flex items-center justify-center text-sm">
                      5
                    </span>
                    Localizações no Depósito
                  </h2>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/localizacao-estoque')}
                    className="px-3 py-1.5 bg-accent-500/10 text-accent-400 border border-accent-500/30 rounded-lg text-xs font-semibold hover:bg-accent-500/20 transition-colors"
                  >
                    + Gerenciar Localizações
                  </button>
                </div>
                
                <div className="ag-theme-alpine-dark w-full h-[200px]">
                  <AgGridReact
                    rowData={localizacoes}
                    columnDefs={columnDefsLocalizacoes}
                    defaultColDef={defaultColDef}
                    overlayNoRowsTemplate="Nenhuma localização cadastrada para este componente."
                  />
                </div>
              </Card>
            )}
          </form>
          )}
        </div>

        {/* Coluna Lateral: Busca e Equivalências (1/3) */}
        <div className="col-span-1 space-y-6">
          <Card padding="md" className="border-surface-800">
            <h3 className="text-sm font-semibold text-surface-100 uppercase tracking-wider mb-4">
              Componentes Cadastrados
            </h3>
            
            <div className="relative mb-4">
              <input 
                type="text" 
                placeholder="Buscar por código ou descrição..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                {filteredLista.map(comp => (
                    <div 
                    key={comp.id}
                    onClick={() => selecionarComponente(comp.id!)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        componenteAtual.id === comp.id 
                        ? 'bg-primary-900/20 border-primary-500/50 ring-1 ring-primary-500/50' 
                        : 'bg-surface-800 border-surface-700 hover:border-surface-600'
                    }`}
                    >
                    <div className="flex justify-between items-start mb-1">
                        <span className={`font-semibold text-sm ${componenteAtual.id === comp.id ? 'text-primary-400' : 'text-surface-100'}`}>{comp.codigo_interno}</span>
                        <span className="text-xs bg-surface-700 text-surface-300 px-2 py-0.5 rounded">
                        {comp.estoque_atual} {comp.unidade}
                        </span>
                    </div>
                    <div className="text-xs text-surface-400 truncate">
                        {comp.descricao_generica}
                    </div>
                    </div>
                ))}
                {filteredLista.length === 0 && (
                  <div className="text-center py-8 text-surface-500 text-sm">Nenhum componente encontrado.</div>
                )}
                </div>
            )}
          </Card>
        </div>

      </div>

      {/* Modal para Novo Tipo */}
      {isTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card padding="lg" className="w-full max-w-sm shadow-2xl border-surface-700">
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
          </Card>
        </div>
      )}
      </div>
    </DefaultLayout>
  );
}
