import { useEffect, useMemo, useState } from 'react';
import DefaultLayout from '../../layouts/DefaultLayout';
import Card from '../../components/shared/Card';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';
import { useLocalizacaoEstoqueStore } from '../../store/useLocalizacaoEstoqueStore';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

ModuleRegistry.registerModules([AllCommunityModule]);

export default function LocalizacaoEstoquePage() {
  const {
    atual,
    lista,
    isLoading,
    isSaving,
    error,
    carregar,
    atualizarCampo,
    selecionar,
    salvar,
    excluir,
    resetForm,
  } = useLocalizacaoEstoqueStore();

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    carregar();
  }, []);

  const filtered = useMemo(() => {
    if (!searchTerm) return lista;
    const s = searchTerm.toLowerCase();
    return lista.filter(
      (l) =>
        l.codigo?.toLowerCase().includes(s) ||
        l.local.toLowerCase().includes(s) ||
        l.sala.toLowerCase().includes(s) ||
        l.corredor.toLowerCase().includes(s) ||
        l.bloco.toLowerCase().includes(s) ||
        l.prateleira.toLowerCase().includes(s)
    );
  }, [lista, searchTerm]);

  // Preview do código em tempo real
  const codigoPreview = useMemo(() => {
    const parts = [atual.local, atual.sala, atual.corredor, atual.lado, atual.bloco, atual.prateleira]
      .filter(Boolean);
    if (parts.length < 6) return '';
    return parts.map((p) => p.toUpperCase()).join('-');
  }, [atual.local, atual.sala, atual.corredor, atual.lado, atual.bloco, atual.prateleira]);

  const columnDefs = useMemo<ColDef[]>(
    () => [
      { field: 'local', headerName: 'Local', width: 120 },
      { field: 'sala', headerName: 'Sala', width: 80 },
      { field: 'corredor', headerName: 'Corredor', width: 100 },
      {
        field: 'lado',
        headerName: 'Lado',
        width: 80,
        cellRenderer: (p: any) => (
          <span className={p.value === 'D' ? 'text-blue-400' : 'text-amber-400'}>
            {p.value === 'D' ? 'Dir' : 'Esq'}
          </span>
        ),
      },
      { field: 'bloco', headerName: 'Bloco', width: 80 },
      { field: 'prateleira', headerName: 'Prateleira', width: 100 },
      {
        field: 'codigo',
        headerName: 'Código Completo',
        width: 280,
        cellClass: 'font-mono text-primary-400 font-bold',
      },
      {
        field: 'quantidade',
        headerName: 'Qtd',
        width: 70,
        cellClass: 'text-center font-bold',
      },
      {
        field: 'capacidade',
        headerName: 'Cap.',
        width: 70,
        cellClass: 'text-center',
      },
      {
        headerName: 'Ações',
        width: 80,
        cellRenderer: (p: any) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Excluir esta localização?')) excluir(p.data.id);
            }}
            className="p-1.5 text-danger-400 hover:bg-danger-500/20 rounded transition-colors"
            title="Excluir"
          >
            🗑️
          </button>
        ),
      },
    ],
    [excluir]
  );

  const defaultColDef = useMemo(() => ({ sortable: true, filter: true, resizable: true }), []);

  return (
    <DefaultLayout>
      <div className="p-6 h-full flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-bold text-surface-50">📦 Localização de Estoque</h1>
          <p className="text-sm text-surface-500 mt-1">
            Hierarquia: Local → Sala → Corredor → Lado → Bloco → Prateleira
          </p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* Formulário */}
          <Card padding="md" className="xl:col-span-1 overflow-y-auto border-surface-700">
            <h2 className="text-lg font-semibold text-surface-100 mb-6 flex items-center gap-2">
              {atual.id ? '📝 Editar Posição' : '✨ Nova Posição'}
            </h2>

            <div className="space-y-4">
              {/* Linha 1: Local + Sala */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-surface-400 uppercase mb-1">
                    Local *
                  </label>
                  <input
                    type="text"
                    value={atual.local}
                    onChange={(e) => atualizarCampo('local', e.target.value)}
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
                    placeholder="Ex: MATRIZ"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-400 uppercase mb-1">
                    Sala *
                  </label>
                  <input
                    type="text"
                    value={atual.sala}
                    onChange={(e) => atualizarCampo('sala', e.target.value)}
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
                    placeholder="Ex: S01"
                  />
                </div>
              </div>

              {/* Linha 2: Corredor + Lado */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-surface-400 uppercase mb-1">
                    Corredor *
                  </label>
                  <input
                    type="text"
                    value={atual.corredor}
                    onChange={(e) => atualizarCampo('corredor', e.target.value)}
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
                    placeholder="Ex: C01"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-400 uppercase mb-1">
                    Lado *
                  </label>
                  <select
                    value={atual.lado}
                    onChange={(e) => atualizarCampo('lado', e.target.value)}
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
                  >
                    <option value="E">Esquerda</option>
                    <option value="D">Direita</option>
                  </select>
                </div>
              </div>

              {/* Linha 3: Bloco + Prateleira */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-surface-400 uppercase mb-1">
                    Bloco *
                  </label>
                  <input
                    type="text"
                    value={atual.bloco}
                    onChange={(e) => atualizarCampo('bloco', e.target.value)}
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
                    placeholder="Ex: B01"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-400 uppercase mb-1">
                    Prateleira *
                  </label>
                  <input
                    type="text"
                    value={atual.prateleira}
                    onChange={(e) => atualizarCampo('prateleira', e.target.value)}
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
                    placeholder="Ex: P01"
                  />
                </div>
              </div>

              {/* Linha 4: Capacidade + Quantidade */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-surface-400 uppercase mb-1">
                    Capacidade
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={atual.capacidade}
                    onChange={(e) => atualizarCampo('capacidade', e.target.value)}
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-400 uppercase mb-1">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={atual.quantidade}
                    onChange={(e) => atualizarCampo('quantidade', e.target.value)}
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Código Preview */}
              {codigoPreview && (
                <div className="p-3 bg-surface-900 border border-primary-500/30 rounded-lg">
                  <span className="text-xs text-surface-400 uppercase">Código Gerado: </span>
                  <span className="font-mono text-primary-400 font-bold text-lg">{codigoPreview}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={atual.ativo}
                  onChange={(e) => atualizarCampo('ativo', e.target.checked)}
                  className="w-4 h-4 rounded border-surface-700 bg-surface-950 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="ativo" className="text-sm text-surface-300">Ativo</label>
              </div>

              {error && (
                <div className="p-3 bg-danger-500/10 border border-danger-500/30 rounded-lg text-xs text-danger-400">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-6">
                <button
                  onClick={resetForm}
                  className="bg-surface-800 hover:bg-surface-700 text-primary-400 border border-primary-500/30 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  ✨ Nova
                </button>
                <button
                  onClick={salvar}
                  disabled={isSaving}
                  className="flex-1 bg-primary-600 hover:bg-primary-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </Card>

          {/* Listagem */}
          <Card padding="md" className="xl:col-span-2 flex flex-col border-surface-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-surface-100">📋 Posições Cadastradas</h2>
              {isLoading && <span className="text-xs text-primary-400 animate-pulse">Carregando...</span>}
            </div>

            <div className="mb-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por código, local, sala, corredor, bloco..."
                className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="ag-theme-alpine-dark flex-1 w-full min-h-[400px]">
              <AgGridReact
                rowData={filtered}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                onRowClicked={(e) => e.data.id && selecionar(e.data.id)}
                pagination={true}
                paginationPageSize={15}
                paginationPageSizeSelector={[10, 15, 30, 50]}
              />
            </div>
          </Card>
        </div>
      </div>
    </DefaultLayout>
  );
}
