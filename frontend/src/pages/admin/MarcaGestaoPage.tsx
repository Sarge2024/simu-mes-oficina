import { useState, useEffect, useMemo } from 'react';
import { useVehicleStore } from '../../store/useVehicleStore';
import DefaultLayout from '../../layouts/DefaultLayout';

export default function MarcaGestaoPage() {
  const { listaMarcas, carregarMarcas, atualizarStatusMarca, isLoading } = useVehicleStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('carro');

  // Carrega as marcas sempre que a categoria mudar
  useEffect(() => {
    if (selectedCategory) {
      carregarMarcas(selectedCategory);
    }
  }, [selectedCategory]);

  const toggleCategory = (id: string) => {
    setSelectedCategory(id);
  };

  const filteredMarcas = useMemo(() => {
    return listaMarcas.filter(m => {
      const matchesSearch = m.nome_marca.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesActive = filterActive === null || m.ativo === filterActive;
      // No frontend não precisamos filtrar por categoria se o backend já filtrou, 
      // mas mantemos por segurança caso m.categorias exista
      const matchesCategory = !selectedCategory || (m.categorias && m.categorias.includes(selectedCategory)) || true;
      return matchesSearch && matchesActive && matchesCategory;
    }).sort((a, b) => a.nome_marca.localeCompare(b.nome_marca));
  }, [listaMarcas, searchTerm, filterActive, selectedCategory]);

  const stats = useMemo(() => {
    const total = listaMarcas.length;
    const ativos = listaMarcas.filter(m => m.ativo).length;
    return { total, ativos };
  }, [listaMarcas]);

  return (
    <DefaultLayout>
      <div className="p-6 h-full flex flex-col gap-4 overflow-hidden">
        {/* Header Compacto */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary-500/10 text-primary-400 p-1.5 rounded-lg text-xl">⚙️</div>
            <div>
              <h1 className="text-xl font-bold text-surface-50 leading-tight">Gestão de Catálogo por Categoria</h1>
              <div className="flex gap-4 mt-1">
                <span className="text-[10px] text-surface-500 font-bold uppercase tracking-wider">Marcas na Categoria: <span className="text-surface-300">{stats.total}</span></span>
                <span className="text-[10px] text-primary-500 font-bold uppercase tracking-wider">Ativas: <span className="text-primary-400">{stats.ativos}</span></span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => { if(window.confirm(`Ativar todas as marcas de ${selectedCategory}?`)) filteredMarcas.forEach(m => !m.ativo && atualizarStatusMarca(m.id, true)) }}
              className="px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-[10px] font-bold hover:bg-green-500/20 transition-all"
            >
              🚀 ATIVAR TODAS VISÍVEIS
            </button>
            <button 
              onClick={() => { if(window.confirm(`Inativar todas as marcas de ${selectedCategory}?`)) filteredMarcas.forEach(m => m.ativo && atualizarStatusMarca(m.id, false)) }}
              className="px-3 py-1.5 bg-danger-500/10 text-danger-400 border border-danger-500/20 rounded-lg text-[10px] font-bold hover:bg-danger-500/20 transition-all"
            >
              🛑 INATIVAR TODAS VISÍVEIS
            </button>
          </div>
        </div>

        {/* 1. SELEÇÃO DE CATEGORIA (PRIORITÁRIA) */}
        <div className="bg-surface-900/40 p-4 rounded-xl border border-surface-800">
          <p className="text-[10px] font-black text-surface-500 uppercase tracking-widest mb-3">Selecione a Categoria para Gerenciar:</p>
          <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'carro', label: 'Carros', icon: '🚗' },
              { id: 'moto', label: 'Motos', icon: '🏍️' },
              { id: 'caminhao', label: 'Caminhões', icon: '🚛' },
              { id: 'onibus', label: 'Ônibus', icon: '🚌' },
              { id: 'utilitario', label: 'Utilitários', icon: '🚐' },
              { id: 'outro', label: 'Outros', icon: '🚜' },
            ].map((cat) => (
              <button 
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`flex flex-col items-center gap-1.5 px-6 py-3 rounded-xl text-xs font-bold transition-all border min-w-[100px] ${
                  selectedCategory === cat.id 
                    ? 'bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-500/30' 
                    : 'bg-surface-950 border-surface-800 text-surface-500 hover:border-surface-600'
                }`}
              >
                <span className="text-xl">{cat.icon}</span>
                <span>{cat.label.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. FILTROS DE MARCAS DA CATEGORIA */}
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 text-sm">🔍</span>
            <input 
              type="text" 
              placeholder={`Pesquisar marca em ${selectedCategory}...`} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface-900/50 border border-surface-800 rounded-lg pl-9 pr-4 py-2 text-sm text-surface-100 focus:outline-none focus:border-primary-500/50 transition-all"
            />
          </div>

          <div className="flex bg-surface-900 p-1 rounded-lg border border-surface-800 shrink-0">
            {[
              { id: null, label: 'TUDO' },
              { id: true, label: 'ATIVAS' },
              { id: false, label: 'INATIVAS' },
            ].map(f => (
              <button 
                key={String(f.id)}
                onClick={() => setFilterActive(f.id)}
                className={`px-4 py-1.5 rounded-md text-[10px] font-black tracking-wider transition-all ${filterActive === f.id ? 'bg-surface-700 text-white shadow-sm' : 'text-surface-500 hover:text-surface-300'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. LISTAGEM DE MARCAS */}
        <div className="flex-1 min-h-0 bg-surface-900/20 rounded-xl border border-surface-800/50 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
              <p className="text-[10px] text-surface-500 font-bold uppercase tracking-widest animate-pulse">Sincronizando Marcas de {selectedCategory}...</p>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 custom-scrollbar content-start">
              {filteredMarcas.map(marca => (
                <div 
                  key={marca.id}
                  onClick={() => atualizarStatusMarca(marca.id, !marca.ativo)}
                  className={`group cursor-pointer relative p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between h-24 ${
                    marca.ativo 
                      ? 'bg-primary-500/5 border-primary-500/30 shadow-lg shadow-primary-500/5' 
                      : 'bg-surface-950/40 border-surface-900 opacity-40 grayscale'
                  }`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <span className={`text-[12px] font-black leading-tight line-clamp-2 uppercase ${marca.ativo ? 'text-surface-50' : 'text-surface-500'}`}>
                      {marca.nome_marca}
                    </span>
                    <div className="shrink-0 mt-0.5">
                       {marca.ativo ? (
                         <div className="w-4 h-4 bg-primary-500 rounded-md flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.6)]">
                            <span className="text-[10px] text-white font-bold">✓</span>
                         </div>
                       ) : (
                         <div className="w-4 h-4 border border-surface-700 rounded-md"></div>
                       )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-auto border-t border-surface-800/50 pt-2">
                     <span className={`text-[9px] font-black tracking-tighter ${marca.ativo ? 'text-primary-400' : 'text-surface-700'}`}>
                      {marca.ativo ? 'DISPONÍVEL' : 'BLOQUEADO'}
                    </span>
                    <div className={`text-[10px] ${marca.ativo ? 'text-primary-500' : 'text-surface-800'}`}>
                      {marca.ativo ? '🔘' : '⚪'}
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredMarcas.length === 0 && (
                <div className="col-span-full py-20 text-center flex flex-col items-center">
                  <span className="text-4xl mb-4 opacity-10">🚫</span>
                  <p className="text-surface-600 text-xs font-black uppercase tracking-widest">Nenhuma marca vinculada à categoria {selectedCategory}.</p>
                </div>
              )}
            </div>
          )}
          
          <div className="px-6 py-2.5 bg-surface-950/80 border-t border-surface-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
               <span className="w-2 h-2 bg-primary-500 rounded-full animate-ping"></span>
               <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">
                Modo Gestão: {selectedCategory.toUpperCase()}
              </span>
            </div>
            <span className="text-[10px] font-black text-surface-600 uppercase">
              Total de Marcas Filtradas: {filteredMarcas.length}
            </span>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
