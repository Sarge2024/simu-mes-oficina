import { useState, useEffect, useMemo } from 'react';
import DefaultLayout from '../../layouts/DefaultLayout';
import { djangoApi } from '../../lib/api';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';
import PageHeader from '../../components/shared/PageHeader';
import Card from '../../components/shared/Card';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

ModuleRegistry.registerModules([AllCommunityModule]);

interface PlanoConta {
  id: number;
  codigo: string;
  descricao: string;
  tipo_natureza: string;
  nivel: number;
  ativo: boolean;
}

export default function PlanoContasPage() {
  const [contas, setContas] = useState<PlanoConta[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<Partial<PlanoConta> | null>(null);

  const fetchContas = async () => {
    try {
      setLoading(true);
      const res = await djangoApi.get('/financeiro/plano-contas/?page_size=200');
      setContas(res.data.results || res.data);
    } catch (err) {
      console.error("Erro ao carregar plano de contas", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContas();
  }, []);

  const columnDefs = useMemo<ColDef[]>(() => [
    { 
      field: 'codigo', 
      headerName: 'Código', 
      width: 150, 
      pinned: 'left',
      cellStyle: (params): any => {
        if (params.data.nivel === 1) return { fontWeight: 'bold', color: '#6366f1' };
        if (params.data.nivel === 2) return { fontWeight: 'semibold', paddingLeft: '15px' };
        if (params.data.nivel === 3) return { paddingLeft: '30px', color: '#94a3b8' };
        return { paddingLeft: (params.data.nivel - 1) * 15 + 'px' };
      }
    },
    { 
      field: 'descricao', 
      headerName: 'Descrição da Conta', 
      flex: 1,
      cellStyle: (params): any => {
        if (params.data.nivel === 1) return { fontWeight: 'bold', fontSize: '15px' };
        return {};
      }
    },
    { 
      field: 'tipo_natureza', 
      headerName: 'Natureza', 
      width: 120,
      valueFormatter: (p) => p.value.charAt(0).toUpperCase() + p.value.slice(1),
      cellRenderer: (params: any) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          params.value === 'receita' ? 'bg-accent-500/20 text-accent-400' : 'bg-danger-500/20 text-danger-400'
        }`}>
          {params.value}
        </span>
      )
    },
    { 
      field: 'nivel', 
      headerName: 'Nível', 
      width: 80,
      cellClass: 'text-center'
    },
    {
      headerName: 'Ações',
      width: 100,
      pinned: 'right',
      cellRenderer: (params: any) => (
        <div className="flex gap-2 items-center h-full">
          <button 
            onClick={() => handleEdit(params.data)}
            className="p-1.5 hover:bg-surface-700 rounded-lg text-surface-400 hover:text-primary-400 transition-colors"
          >
            ✏️
          </button>
          <button 
            onClick={() => handleDelete(params.data.id)}
            className="p-1.5 hover:bg-surface-700 rounded-lg text-surface-400 hover:text-danger-400 transition-colors"
          >
            🗑️
          </button>
        </div>
      )
    }
  ], []);

  const handleEdit = (conta: PlanoConta) => {
    setEditingConta(conta);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deseja realmente excluir esta conta?")) return;
    try {
      await djangoApi.delete(`/financeiro/plano-contas/${id}/`);
      fetchContas();
    } catch (err) {
      alert("Erro ao excluir conta");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingConta?.id) {
        await djangoApi.put(`/financeiro/plano-contas/${editingConta.id}/`, editingConta);
      } else {
        await djangoApi.post('/financeiro/plano-contas/', editingConta);
      }
      setIsModalOpen(false);
      fetchContas();
    } catch (err) {
      alert("Erro ao salvar conta");
    }
  };

  return (
    <DefaultLayout>
      <div className="max-w-7xl mx-auto flex flex-col h-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <PageHeader 
            title="📊 Plano de Contas Gerencial (ECO)" 
            subtitle="Estrutura de 5 níveis para apuração de PEO, PEE e PEF" 
          />
          <button 
            onClick={() => { setEditingConta({ nivel: 1, tipo_natureza: 'receita', ativo: true }); setIsModalOpen(true); }}
            className="px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-500 transition-all shadow-lg shadow-primary-900/20 active:scale-95 mb-8"
          >
            + Nova Conta
          </button>
        </div>

        <Card padding="none" className="overflow-hidden shadow-2xl">
          <div className="ag-theme-alpine-dark w-full" style={{ height: 'calc(100vh - 250px)' }}>
            <AgGridReact
              theme="legacy"
              rowData={contas}
              columnDefs={columnDefs}
              defaultColDef={{
                sortable: true,
                filter: true,
                resizable: true,
              }}
              loading={loading}
              animateRows={true}
              rowHeight={48}
              headerHeight={48}
            />
          </div>
        </Card>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-sm">
          <Card padding="lg" className="w-full max-w-md shadow-2xl">
            <form onSubmit={handleSubmit}>
              <h2 className="text-xl font-bold text-surface-50 mb-6">
                {editingConta?.id ? 'Editar Conta' : 'Nova Conta Contábil'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Código</label>
                  <input 
                    type="text" 
                    value={editingConta?.codigo || ''}
                    onChange={e => setEditingConta({...editingConta, codigo: e.target.value})}
                    placeholder="Ex: 1.1.1.0.0"
                    className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-2.5 text-surface-100 focus:outline-none focus:border-primary-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Descrição</label>
                  <input 
                    type="text" 
                    value={editingConta?.descricao || ''}
                    onChange={e => setEditingConta({...editingConta, descricao: e.target.value})}
                    placeholder="Nome da conta"
                    className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-2.5 text-surface-100 focus:outline-none focus:border-primary-500 transition-colors"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Natureza</label>
                    <select 
                      value={editingConta?.tipo_natureza || 'receita'}
                      onChange={e => setEditingConta({...editingConta, tipo_natureza: e.target.value})}
                      className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-2.5 text-surface-100 focus:outline-none focus:border-primary-500 transition-colors"
                    >
                      <option value="receita">Receita</option>
                      <option value="despesa">Despesa</option>
                      <option value="ativo">Ativo</option>
                      <option value="passivo">Passivo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">Nível</label>
                    <input 
                      type="number" 
                      min="1" max="5"
                      value={editingConta?.nivel || 1}
                      onChange={e => setEditingConta({...editingConta, nivel: parseInt(e.target.value)})}
                      className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-2.5 text-surface-100 focus:outline-none focus:border-primary-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-surface-700 text-surface-300 font-medium hover:bg-surface-800 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-500 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </DefaultLayout>
  );
}
