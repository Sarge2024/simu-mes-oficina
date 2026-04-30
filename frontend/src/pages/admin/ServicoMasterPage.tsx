import { useEffect, useMemo } from 'react';
import DefaultLayout from '../../layouts/DefaultLayout';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';
import { useServicoStore } from '../../store/useServicoStore';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

ModuleRegistry.registerModules([AllCommunityModule]);

export default function ServicoMasterPage() {
  const { 
    servicoAtual, 
    listaServicos, 
    isLoading, 
    isSaving, 
    error,
    carregarServicos,
    atualizarCampo,
    selecionarServico,
    salvarServico,
    excluirServico,
    resetForm
  } = useServicoStore();

  useEffect(() => {
    carregarServicos();
  }, []);

  const columnDefs = useMemo<ColDef[]>(() => [
    { field: 'codigo', headerName: 'Código', width: 120 },
    { field: 'descricao', headerName: 'Descrição', flex: 1 },
    { field: 'tempo_padrao', headerName: 'Tempo (h)', width: 100 },
    { 
      field: 'preco_base', 
      headerName: 'Preço (R$)', 
      width: 120,
      valueFormatter: p => p.value ? `R$ ${Number(p.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''
    },
    { field: 'especialidade', headerName: 'Especialidade', width: 150 },
    { 
      field: 'ativo', 
      headerName: 'Status', 
      width: 100,
      cellRenderer: (p: any) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.value ? 'bg-green-500/20 text-green-400' : 'bg-danger-500/20 text-danger-400'}`}>
          {p.value ? 'ATIVO' : 'INATIVO'}
        </span>
      )
    },
    {
      headerName: 'Ações',
      width: 100,
      cellRenderer: (p: any) => (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if(window.confirm('Excluir este serviço?')) excluirServico(p.data.id);
          }}
          className="p-1.5 text-danger-400 hover:bg-danger-500/20 rounded transition-colors"
          title="Excluir"
        >
          🗑️
        </button>
      )
    }
  ], [excluirServico]);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true
  }), []);

  return (
    <DefaultLayout>
      <div className="p-6 h-full flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-bold text-surface-50">🛠️ Catálogo de Serviços</h1>
          <p className="text-sm text-surface-500 mt-1">Gerencie a lista de mão de obra e serviços prestados pela oficina</p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* Formulário */}
          <div className="xl:col-span-1 bg-surface-900 border border-surface-700 rounded-xl p-6 overflow-y-auto">
            <h2 className="text-lg font-semibold text-surface-100 mb-6 flex items-center gap-2">
              {servicoAtual.id ? '📝 Editar Serviço' : '✨ Novo Serviço'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-surface-400 uppercase mb-1">Código</label>
                <input
                  type="text"
                  value={servicoAtual.codigo}
                  onChange={(e) => atualizarCampo('codigo', e.target.value)}
                  className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
                  placeholder="Ex: MO-MOT-001"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-surface-400 uppercase mb-1">Descrição</label>
                <input
                  type="text"
                  value={servicoAtual.descricao}
                  onChange={(e) => atualizarCampo('descricao', e.target.value)}
                  className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
                  placeholder="Ex: Troca de Embreagem"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-surface-400 uppercase mb-1">Tempo Padrão (h)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={servicoAtual.tempo_padrao}
                    onChange={(e) => atualizarCampo('tempo_padrao', e.target.value)}
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-400 uppercase mb-1">Preço Base (R$)</label>
                  <input
                    type="number"
                    value={servicoAtual.preco_base}
                    onChange={(e) => atualizarCampo('preco_base', e.target.value)}
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-surface-400 uppercase mb-1">Especialidade</label>
                <input
                  type="text"
                  value={servicoAtual.especialidade}
                  onChange={(e) => atualizarCampo('especialidade', e.target.value)}
                  className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
                  placeholder="Ex: Motor, Elétrica, Suspensão"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={servicoAtual.ativo}
                  onChange={(e) => atualizarCampo('ativo', e.target.checked)}
                  className="w-4 h-4 rounded border-surface-700 bg-surface-950 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="ativo" className="text-sm text-surface-300">Serviço Ativo</label>
              </div>

              {error && (
                <div className="p-3 bg-danger-500/10 border border-danger-500/30 rounded-lg text-xs text-danger-400">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-6">
                <button
                  onClick={salvarServico}
                  disabled={isSaving}
                  className="flex-1 bg-primary-600 hover:bg-primary-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  onClick={resetForm}
                  className="bg-surface-800 hover:bg-surface-700 text-surface-300 py-2 px-4 rounded-lg transition-colors"
                >
                  Limpar
                </button>
              </div>
            </div>
          </div>

          {/* Listagem */}
          <div className="xl:col-span-2 bg-surface-900 border border-surface-700 rounded-xl p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-surface-100">📋 Serviços Cadastrados</h2>
              {isLoading && <span className="text-xs text-primary-400 animate-pulse">Carregando...</span>}
            </div>

            <div className="ag-theme-alpine-dark flex-1 w-full min-h-[400px]">
              <AgGridReact
                rowData={listaServicos}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                onRowClicked={(e) => e.data.id && selecionarServico(e.data.id)}
                pagination={true}
                paginationPageSize={10}
              />
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
