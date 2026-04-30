import { useState } from 'react';
import DefaultLayout from '../../layouts/DefaultLayout';
import { useAgendaStore, type Profissional } from '../../store/useAgendaStore';

export default function ConfiguracaoOficinaPage() {
  const { equipe, boxes, adicionarProfissional, removerProfissional, adicionarBox, removerBox } = useAgendaStore();
  
  const [novoProf, setNovoProf] = useState<Partial<Profissional>>({ nome: '', especialidade: 'Mecânico' });
  const [novoBoxNome, setNovoBoxNome] = useState('');

  const handleAddProf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoProf.nome) return;
    adicionarProfissional({
      id: Date.now().toString(),
      nome: novoProf.nome,
      especialidade: novoProf.especialidade as any,
      ativo: true
    });
    setNovoProf({ nome: '', especialidade: 'Mecânico' });
  };

  const handleAddBox = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoBoxNome) return;
    adicionarBox({
      box: novoBoxNome,
      os: '',
      mecanico: '— Livre —',
      inicio: '',
      fim: '',
      status: 'Disponível'
    });
    setNovoBoxNome('');
  };

  return (
    <DefaultLayout>
      <div className="p-8 max-w-5xl mx-auto overflow-y-auto h-full">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-surface-50">🛠️ Configurações da Oficina</h1>
          <p className="text-sm text-surface-500 mt-1">Gerencie sua equipe técnica e infraestrutura física</p>
        </header>

        <div className="grid grid-cols-2 gap-8">
          
          {/* Seção Equipe */}
          <div className="space-y-6">
            <div className="bg-surface-900 border border-surface-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
                👥 Equipe Técnica
              </h2>
              
              <form onSubmit={handleAddProf} className="flex gap-2 mb-6">
                <input 
                  type="text"
                  placeholder="Nome do profissional"
                  value={novoProf.nome}
                  onChange={e => setNovoProf({...novoProf, nome: e.target.value})}
                  className="flex-1 bg-surface-800 border border-surface-700 text-surface-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                />
                <select 
                  value={novoProf.especialidade}
                  onChange={e => setNovoProf({...novoProf, especialidade: e.target.value as any})}
                  className="bg-surface-800 border border-surface-700 text-surface-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                >
                  <option value="Supervisor">Supervisor</option>
                  <option value="Mecânico">Mecânico</option>
                  <option value="Eletricista">Eletricista</option>
                  <option value="Meceletri">Meceletri</option>
                </select>
                <button className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                  +
                </button>
              </form>

              <div className="space-y-2">
                {equipe.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-surface-800 border border-surface-700 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-surface-100">{p.nome}</p>
                      <p className="text-xs text-surface-500">{p.especialidade}</p>
                    </div>
                    <button 
                      onClick={() => removerProfissional(p.id)}
                      className="text-danger-500 hover:text-danger-400 text-xs p-2"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Seção Boxes */}
          <div className="space-y-6">
            <div className="bg-surface-900 border border-surface-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
                📦 Boxes e Rampas
              </h2>
              
              <form onSubmit={handleAddBox} className="flex gap-2 mb-6">
                <input 
                  type="text"
                  placeholder="Ex: Box 05 ou Rampa 02"
                  value={novoBoxNome}
                  onChange={e => setNovoBoxNome(e.target.value)}
                  className="flex-1 bg-surface-800 border border-surface-700 text-surface-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                />
                <button className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                  Adicionar Box
                </button>
              </form>

              <div className="space-y-2">
                {boxes.map(b => (
                  <div key={b.box} className="flex items-center justify-between p-3 bg-surface-800 border border-surface-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🔧</span>
                      <p className="text-sm font-medium text-surface-100">{b.box}</p>
                    </div>
                    <button 
                      onClick={() => removerBox(b.box)}
                      className="text-danger-500 hover:text-danger-400 text-xs p-2"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </DefaultLayout>
  );
}
