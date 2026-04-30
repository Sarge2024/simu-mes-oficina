import { useState, useEffect, useMemo } from 'react';
import DefaultLayout from '../../layouts/DefaultLayout';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { useUISettingsStore, ACCENT_MAP } from '../../store/useUISettingsStore';

ModuleRegistry.registerModules([AllCommunityModule]);

interface Empresa {
  id: number;
  razao_social: string;
  cnpj: string;
  inscricao_estadual: string;
  endereco: string;
  telefone: string;
  email: string;
  configuracoes: Record<string, unknown> | string;
  ativo: boolean;
}

export default function EmpresaMasterPage() {
  const { accent, cardStyle } = useUISettingsStore();
  const accentColor = ACCENT_MAP[accent].primary;

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Partial<Empresa> | null>(null);

  const fetchEmpresas = async () => {
    try {
      const res = await fetch('/api/django/api/core/empresas/');
      const data = await res.json();
      setEmpresas(data);
    } catch (err) {
      console.error('Error fetching empresas:', err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEmpresas();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEditing = !!editingEmpresa?.id;
    const url = isEditing 
      ? `/api/django/api/core/empresas/${editingEmpresa.id}/`
      : `/api/django/api/core/empresas/`;
    
    const method = isEditing ? 'PUT' : 'POST';

    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingEmpresa,
          configuracoes: typeof editingEmpresa?.configuracoes === 'string' 
            ? JSON.parse(editingEmpresa.configuracoes) 
            : (editingEmpresa?.configuracoes || {})
        }),
      });
      setIsDrawerOpen(false);
      setEditingEmpresa(null);
      fetchEmpresas();
    } catch (err) {
      console.error('Error saving empresa:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente excluir esta empresa?')) return;
    try {
      await fetch(`/api/django/api/core/empresas/${id}/`, { method: 'DELETE' });
      fetchEmpresas();
    } catch (err) {
      console.error('Error deleting empresa:', err);
    }
  };

  const ActionButtons = (props: ICellRendererParams) => {
    return (
      <div className="flex gap-2">
        <button 
          onClick={() => { setEditingEmpresa(props.data); setIsDrawerOpen(true); }}
          className="px-2 py-1 bg-surface-700 text-surface-200 rounded text-xs hover:bg-surface-600 transition-colors"
        >
          Editar
        </button>
        <button 
          onClick={() => handleDelete(props.data.id)}
          className="px-2 py-1 bg-danger-500/20 text-danger-400 rounded text-xs hover:bg-danger-500/40 transition-colors"
        >
          Excluir
        </button>
      </div>
    );
  };

  const StatusBadge = (props: ICellRendererParams) => {
    return props.value 
      ? <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-medium">Ativo</span>
      : <span className="px-2 py-1 rounded bg-danger-500/20 text-danger-400 text-xs font-medium">Inativo</span>;
  };

  const columnDefs = useMemo<ColDef[]>(() => [
    { field: 'razao_social', headerName: 'Razão Social', flex: 1 },
    { field: 'cnpj', headerName: 'CNPJ', width: 160 },
    { field: 'email', headerName: 'E-mail', flex: 1 },
    { field: 'telefone', headerName: 'Telefone', width: 140 },
    { field: 'ativo', headerName: 'Status', width: 100, cellRenderer: StatusBadge },
    { headerName: 'Ações', width: 140, cellRenderer: ActionButtons, sortable: false, filter: false },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  const defaultColDef = useMemo(() => ({ sortable: true, filter: true, resizable: true }), []);

  const cardClass = `bg-surface-900 border border-surface-700 p-6 ${
    cardStyle === 'sharp' ? 'rounded-none' : cardStyle === 'glass' ? 'rounded-2xl backdrop-blur-xl bg-white/[0.03]' : 'rounded-xl'
  }`;

  return (
    <DefaultLayout>
      <div className="p-6 h-full flex flex-col">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-surface-50">🏢 Cadastro Master da Empresa</h1>
            <p className="text-sm text-surface-500 mt-1">Gerencie as matrizes e filiais do sistema</p>
          </div>
          <button 
            onClick={() => { setEditingEmpresa({ ativo: true, configuracoes: JSON.stringify({ theme: 'dark' }, null, 2) }); setIsDrawerOpen(true); }}
            className="px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90 shadow-lg"
            style={{ backgroundColor: accentColor, boxShadow: `0 10px 15px -3px ${accentColor}40` }}
          >
            + Nova Empresa
          </button>
        </header>

        <div className={`flex-1 ${cardClass}`}>
          <div className="ag-theme-alpine-dark w-full h-full min-h-[400px]">
            <AgGridReact
              rowData={empresas}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
            />
          </div>
        </div>

        {/* Drawer de Cadastro */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
            <div className="w-[500px] h-full bg-surface-900 border-l border-surface-700 shadow-2xl p-6 overflow-y-auto flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-surface-100">{editingEmpresa?.id ? 'Editar Empresa' : 'Nova Empresa'}</h2>
                <button onClick={() => setIsDrawerOpen(false)} className="text-surface-400 hover:text-surface-200">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 flex flex-col gap-4">
                <div>
                  <label className="block text-sm text-surface-400 mb-1">Razão Social *</label>
                  <input required value={editingEmpresa?.razao_social || ''} onChange={(e) => setEditingEmpresa({...editingEmpresa, razao_social: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none focus:ring-2" style={{ '--tw-ring-color': accentColor } as React.CSSProperties} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-surface-400 mb-1">CNPJ *</label>
                    <input required value={editingEmpresa?.cnpj || ''} onChange={(e) => setEditingEmpresa({...editingEmpresa, cnpj: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-surface-400 mb-1">Insc. Estadual</label>
                    <input value={editingEmpresa?.inscricao_estadual || ''} onChange={(e) => setEditingEmpresa({...editingEmpresa, inscricao_estadual: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-surface-400 mb-1">E-mail</label>
                    <input type="email" value={editingEmpresa?.email || ''} onChange={(e) => setEditingEmpresa({...editingEmpresa, email: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-surface-400 mb-1">Telefone</label>
                    <input value={editingEmpresa?.telefone || ''} onChange={(e) => setEditingEmpresa({...editingEmpresa, telefone: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-surface-400 mb-1">Endereço Completo</label>
                  <textarea rows={3} value={editingEmpresa?.endereco || ''} onChange={(e) => setEditingEmpresa({...editingEmpresa, endereco: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-surface-400 mb-1">Configurações (JSON)</label>
                  <textarea rows={4} value={typeof editingEmpresa?.configuracoes === 'object' ? JSON.stringify(editingEmpresa?.configuracoes, null, 2) : editingEmpresa?.configuracoes || ''} onChange={(e) => setEditingEmpresa({...editingEmpresa, configuracoes: e.target.value})} className="w-full font-mono text-xs px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-200 focus:outline-none" />
                </div>
                <div className="flex items-center mt-2">
                  <input type="checkbox" id="ativo" checked={editingEmpresa?.ativo} onChange={(e) => setEditingEmpresa({...editingEmpresa, ativo: e.target.checked})} className="mr-2 rounded border-surface-700 text-primary-600 focus:ring-primary-500 bg-surface-800" />
                  <label htmlFor="ativo" className="text-sm text-surface-200">Cadastro Ativo</label>
                </div>
                
                <div className="mt-auto pt-6 flex gap-3">
                  <button type="button" onClick={() => setIsDrawerOpen(false)} className="flex-1 px-4 py-2 rounded-lg border border-surface-600 text-surface-200 hover:bg-surface-800 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors" style={{ backgroundColor: accentColor }}>
                    Salvar Dados
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
}
