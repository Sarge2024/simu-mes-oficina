import { useEffect, useState, useMemo } from 'react';
import { useVehicleStore } from '../../store/useVehicleStore';
import DefaultLayout from '../../layouts/DefaultLayout';
import Card from '../../components/shared/Card';
import PageHeader from '../../components/shared/PageHeader';

export default function MarcaSelectorPage() {
  const { listaMarcas, carregarMarcas, atualizarStatusMarca, isLoading } = useVehicleStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<number | ''>('');

  useEffect(() => {
    carregarMarcas();
  }, [carregarMarcas]);

  const filteredMarcas = useMemo(() => {
    return listaMarcas
      .filter(m => m.nome_marca.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        if (a.ativo !== b.ativo) return a.ativo ? -1 : 1;
        return a.nome_marca.localeCompare(b.nome_marca);
      });
  }, [listaMarcas, searchTerm]);

  const stats = useMemo(() => {
    const total = listaMarcas.length;
    const ativos = listaMarcas.filter(m => m.ativo).length;
    return { total, ativos, inativos: total - ativos };
  }, [listaMarcas]);

  const handleComboboxChange = (id: number) => {
    const marca = listaMarcas.find(m => m.id === id);
    if (marca) {
      atualizarStatusMarca(id, !marca.ativo);
    }
    setSelectedId('');
  };

  return (
    <DefaultLayout>
      <div className="max-w-3xl mx-auto flex flex-col h-full">
        <PageHeader
          title="🏷️ Seleção de Marcas"
          subtitle="Escolha quais marcas ficam disponíveis para os operadores"
          showBackButton={false}
        />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card padding="sm" className="bg-surface-900/50 border-surface-800 text-center">
            <span className="text-[10px] font-bold text-surface-500 uppercase tracking-widest">Total</span>
            <p className="text-2xl font-bold text-surface-100">{stats.total}</p>
          </Card>
          <Card padding="sm" className="bg-primary-500/5 border-primary-500/20 text-center">
            <span className="text-[10px] font-bold text-primary-500/70 uppercase tracking-widest">Ativas</span>
            <p className="text-2xl font-bold text-primary-400">{stats.ativos}</p>
          </Card>
          <Card padding="sm" className="bg-surface-900/50 border-surface-800 text-center">
            <span className="text-[10px] font-bold text-surface-500 uppercase tracking-widest">Ocultas</span>
            <p className="text-2xl font-bold text-surface-400">{stats.inativos}</p>
          </Card>
        </div>

        {/* Combobox Section */}
        <Card padding="md" className="mb-6 bg-surface-900/40 border-surface-800">
          <h2 className="text-sm font-semibold text-surface-100 mb-3">Alternar marca rapidamente</h2>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Buscar marca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface-950 border border-surface-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-surface-100 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 placeholder:text-surface-600"
              />
            </div>
            <select
              className="w-full max-w-xs bg-surface-950 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-surface-300 focus:outline-none focus:border-primary-500"
              value={selectedId}
              onChange={(e) => {
                const val = e.target.value;
                if (val) handleComboboxChange(Number(val));
              }}
            >
              <option value="" disabled>Selecione uma marca...</option>
              {listaMarcas
                .sort((a, b) => a.nome_marca.localeCompare(b.nome_marca))
                .map(m => (
                  <option key={m.id} value={m.id}>
                    {m.ativo ? '✅' : '❌'} {m.nome_marca}
                  </option>
                ))}
            </select>
          </div>
          {selectedId && (
            <p className="text-xs text-primary-400 mt-2">
              Status da marca alterado com sucesso.
            </p>
          )}
        </Card>

        {/* Global Actions */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => {
              if (window.confirm('Ativar TODAS as marcas?')) {
                listaMarcas.forEach(m => { if (!m.ativo) atualizarStatusMarca(m.id, true); });
              }
            }}
            className="px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/30 rounded-xl text-xs font-bold hover:bg-green-500/20 transition-all"
          >
            Ativar Todas
          </button>
          <button
            onClick={() => {
              if (window.confirm('Ocultar TODAS as marcas?')) {
                listaMarcas.forEach(m => { if (m.ativo) atualizarStatusMarca(m.id, false); });
              }
            }}
            className="px-4 py-2 bg-danger-500/10 text-danger-400 border border-danger-500/30 rounded-xl text-xs font-bold hover:bg-danger-500/20 transition-all"
          >
            Ocultar Todas
          </button>
        </div>

        {/* Brand List */}
        <Card padding="none" className="flex-1 min-h-0 bg-surface-900/30 border-surface-800 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
              <p className="text-surface-500 text-sm animate-pulse">Carregando marcas...</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {filteredMarcas.map(marca => (
                  <div
                    key={marca.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      marca.ativo
                        ? 'bg-primary-500/5 border-primary-500/20'
                        : 'bg-surface-800/30 border-surface-700/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full ${marca.ativo ? 'bg-primary-500' : 'bg-surface-600'}`}></span>
                      <span className={`text-sm font-medium ${marca.ativo ? 'text-surface-100' : 'text-surface-500'}`}>
                        {marca.nome_marca}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={marca.ativo}
                        onChange={(e) => atualizarStatusMarca(marca.id, e.target.checked)}
                      />
                      <div className="w-9 h-5 bg-surface-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
                {filteredMarcas.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-surface-500 text-sm">Nenhuma marca encontrada.</p>
                  </div>
                )}
              </div>
              <div className="p-3 bg-surface-900/80 border-t border-surface-800">
                <p className="text-xs text-surface-500">
                  Mostrando <span className="text-surface-200 font-bold">{filteredMarcas.length}</span> de {stats.total} marcas
                </p>
              </div>
            </>
          )}
        </Card>
      </div>
    </DefaultLayout>
  );
}
