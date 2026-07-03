import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DefaultLayout from '../../layouts/DefaultLayout';
import { useReferenciaStore, type Referencia } from '../../store/useReferenciaStore';
import { useComponenteStore } from '../../store/useComponenteStore';
import { useVehicleStore } from '../../store/useVehicleStore';
import Card from '../../components/shared/Card';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { useUISettingsStore, ACCENT_MAP } from '../../store/useUISettingsStore';

ModuleRegistry.registerModules([AllCommunityModule]);

export default function ReferenciaFabricantePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accent } = useUISettingsStore();
  const accentColor = ACCENT_MAP[accent]?.primary || '#6366f1';

  const { componenteAtual, selecionarComponente } = useComponenteStore();
  const { 
    referencias, 
    marcas, 
    isLoading, 
    isSaving, 
    error,
    carregarReferencias, 
    carregarMarcas, 
    salvarReferencia, 
    excluirReferencia 
  } = useReferenciaStore();

  const {
    listaModelosFiltrados,
    listaVersoesFiltradas,
    selecionarMarca,
    selecionarModelo
  } = useVehicleStore();

  const [novaRef, setNovaRef] = useState<Partial<Referencia> & { modelo?: number; versao?: number }>({
    marca: undefined,
    codigo_fabricante: '',
    material_construcao: '',
    modelo: undefined,
    versao: undefined
  });

  useEffect(() => {
    if (id) {
      selecionarComponente(Number(id));
      carregarReferencias(Number(id));
      carregarMarcas();
    }
  }, [id, selecionarComponente, carregarReferencias, carregarMarcas]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaRef.marca || !novaRef.codigo_fabricante) return;

    await salvarReferencia({
      componente: Number(id),
      marca: Number(novaRef.marca),
      codigo_fabricante: novaRef.codigo_fabricante,
      material_construcao: novaRef.material_construcao || ''
    });

    // Se houver uma versão selecionada, salva a Aplicação do Veículo
    if (novaRef.versao) {
      try {
        await fetch('/api/django/api/catalogo/aplicacoes_veiculos/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            componente: Number(id),
            versao: Number(novaRef.versao),
            observacoes: 'Vinculado junto com a Referência'
          })
        });
      } catch (err) {
        console.error('Erro ao vincular veículo compatível', err);
      }
    }

    setNovaRef({ marca: undefined, codigo_fabricante: '', material_construcao: '', modelo: undefined, versao: undefined });
  };

  const ActionButton = (props: ICellRendererParams) => (
    <button 
      onClick={() => { if(confirm('Excluir referência?')) excluirReferencia(props.data.id); }}
      className="text-danger-400 hover:text-danger-300 text-xs font-medium"
    >
      Excluir
    </button>
  );

  const columnDefs = useMemo<ColDef[]>(() => [
    { field: 'marca_nome', headerName: 'Marca / Fabricante', flex: 1 },
    { field: 'codigo_fabricante', headerName: 'Código do Produto', flex: 1, cellClass: 'font-mono text-primary-400' },
    { field: 'material_construcao', headerName: 'Material', width: 150 },
    { headerName: 'Ação', width: 100, cellRenderer: ActionButton, cellClass: 'text-center', sortable: false, filter: false }
  ], []);

  return (
    <DefaultLayout>
      <div className="p-8 h-full overflow-y-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-surface-500 mb-2">
              <button onClick={() => navigate('/admin/componentes')} className="hover:text-primary-400 transition-colors">Catálogo</button>
              <span>/</span>
              <span className="text-surface-300">Produtos (Referências)</span>
            </div>
            <h1 className="text-2xl font-bold text-surface-100 flex items-center gap-3">
              Referências de Fabricantes
              <span className="px-3 py-1 bg-surface-800 text-primary-400 rounded-md text-xl border border-surface-700">
                {componenteAtual.codigo_interno}
              </span>
            </h1>
            <p className="text-surface-400 mt-1">{componenteAtual.descricao_generica}</p>
          </div>
          <button 
            onClick={() => navigate('/admin/componentes')}
            className="px-4 py-2 bg-surface-800 text-surface-200 rounded-lg text-sm hover:bg-surface-700 transition-colors border border-surface-700"
          >
            Voltar ao Componente
          </button>
        </header>

        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-1">
            <Card padding="md" className="border-surface-800 sticky top-0">
              <form onSubmit={handleAdd} className="space-y-4">
                <h2 className="text-lg font-semibold text-surface-100 mb-4">Novo Produto (Vínculo)</h2>
                
                <div>
                  <label className="block text-sm text-surface-400 mb-1">Marca / Fabricante *</label>
                  <select 
                    required
                    value={novaRef.marca || ''}
                    onChange={(e) => {
                      const mId = Number(e.target.value);
                      setNovaRef({...novaRef, marca: mId, modelo: undefined, versao: undefined});
                      if (mId) selecionarMarca(mId);
                    }}
                    className="w-full bg-surface-800 border border-surface-700 text-surface-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">Selecione...</option>
                    {marcas.filter(m => m.ativo).map(m => <option key={m.id} value={m.id}>{m.nome_marca}</option>)}
                  </select>
                </div>

                {listaModelosFiltrados.length > 0 && (
                  <div>
                    <label className="block text-sm text-surface-400 mb-1">Modelo do Veículo (Opcional)</label>
                    <select 
                      value={novaRef.modelo || ''}
                      onChange={(e) => {
                        const mId = Number(e.target.value);
                        setNovaRef({...novaRef, modelo: mId, versao: undefined});
                        if (mId) selecionarModelo(mId);
                      }}
                      className="w-full bg-surface-800 border border-surface-700 text-surface-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="">Nenhum modelo específico</option>
                      {listaModelosFiltrados.filter(m => m.ativo).map(m => <option key={m.id} value={m.id}>{m.nome_modelo}</option>)}
                    </select>
                  </div>
                )}

                {listaVersoesFiltradas.length > 0 && novaRef.modelo && (
                  <div>
                    <label className="block text-sm text-surface-400 mb-1">Versão do Veículo (Opcional)</label>
                    <select 
                      value={novaRef.versao || ''}
                      onChange={(e) => setNovaRef({...novaRef, versao: Number(e.target.value)})}
                      className="w-full bg-surface-800 border border-surface-700 text-surface-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="">Nenhuma versão específica</option>
                      {listaVersoesFiltradas.filter(v => v.ativo).map(v => <option key={v.id} value={v.id}>{v.nome_versao} {v.motorizacao} {v.combustivel}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm text-surface-400 mb-1">Código do Fabricante *</label>
                  <input 
                    required
                    type="text"
                    value={novaRef.codigo_fabricante}
                    onChange={(e) => setNovaRef({...novaRef, codigo_fabricante: e.target.value.toUpperCase()})}
                    className="w-full bg-surface-800 border border-surface-700 text-surface-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono"
                    placeholder="Ex: 5.081110"
                  />
                </div>

                <div>
                  <label className="block text-sm text-surface-400 mb-1">Material (Opcional)</label>
                  <input 
                    type="text"
                    value={novaRef.material_construcao}
                    onChange={(e) => setNovaRef({...novaRef, material_construcao: e.target.value})}
                    className="w-full bg-surface-800 border border-surface-700 text-surface-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    placeholder="Ex: NBR, MVQ"
                  />
                </div>

                {error && <p className="text-xs text-danger-400 bg-danger-500/10 p-2 rounded">{error}</p>}

                <button 
                  disabled={isSaving}
                  className="w-full py-2.5 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-500 transition-colors shadow-lg"
                  style={{ backgroundColor: accentColor }}
                >
                  {isSaving ? 'Vinculando...' : '+ Vincular Produto'}
                </button>
              </form>
            </Card>
          </div>

          <div className="col-span-2">
            <Card padding="md" className="h-full flex flex-col border-surface-800">
              <h2 className="text-lg font-semibold text-surface-100 mb-4">Equivalências Disponíveis</h2>
              <div className="ag-theme-alpine-dark w-full flex-1 min-h-[400px]">
                <AgGridReact
                  rowData={referencias}
                  columnDefs={columnDefs}
                  defaultColDef={{ sortable: true, filter: true, resizable: true }}
                  loading={isLoading}
                  overlayNoRowsTemplate="Este componente ainda não possui produtos vinculados."
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
