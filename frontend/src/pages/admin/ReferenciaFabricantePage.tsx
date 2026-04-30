import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DefaultLayout from '../../layouts/DefaultLayout';
import { useReferenciaStore, type Referencia } from '../../store/useReferenciaStore';
import { useComponenteStore } from '../../store/useComponenteStore';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { useUISettingsStore, ACCENT_MAP } from '../../store/useUISettingsStore';

ModuleRegistry.registerModules([AllCommunityModule]);

export default function ReferenciaFabricantePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accent } = useUISettingsStore();
  const accentColor = ACCENT_MAP[accent].primary;

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

  const [novaRef, setNovaRef] = useState<Partial<Referencia>>({
    marca: undefined,
    codigo_fabricante: '',
    material_construcao: ''
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

    setNovaRef({ marca: undefined, codigo_fabricante: '', material_construcao: '' });
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
            <form onSubmit={handleAdd} className="bg-surface-900 border border-surface-800 rounded-xl p-6 space-y-4 sticky top-0">
              <h2 className="text-lg font-semibold text-surface-100 mb-4">Novo Produto (Vínculo)</h2>
              
              <div>
                <label className="block text-sm text-surface-400 mb-1">Marca / Fabricante *</label>
                <select 
                  required
                  value={novaRef.marca || ''}
                  onChange={(e) => setNovaRef({...novaRef, marca: Number(e.target.value)})}
                  className="w-full bg-surface-800 border border-surface-700 text-surface-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Selecione...</option>
                  {marcas.map(m => <option key={m.id} value={m.id}>{m.nome_marca}</option>)}
                </select>
              </div>

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
          </div>

          <div className="col-span-2">
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-6 h-full flex flex-col">
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
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
