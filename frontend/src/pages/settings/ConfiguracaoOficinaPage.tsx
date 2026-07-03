import { useState } from 'react';
import DefaultLayout from '../../layouts/DefaultLayout';
import { useAgendaStore, type Profissional } from '../../store/useAgendaStore';
import PageHeader from '../../components/shared/PageHeader';
import Card from '../../components/shared/Card';

export default function ConfiguracaoOficinaPage() {
  const { equipe, boxes, adicionarProfissional, removerProfissional, adicionarBox, removerBox } = useAgendaStore();
  
  const [novoProf, setNovoProf] = useState<Partial<Profissional>>({ nome: '', especialidade: 'Mecânico', valorHora: 0 });
  const [novoBoxNome, setNovoBoxNome] = useState('');

  const handleAddProf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoProf.nome) return;
    adicionarProfissional({
      id: Date.now().toString(),
      nome: novoProf.nome,
      especialidade: novoProf.especialidade as any,
      ativo: true,
      valorHora: novoProf.valorHora || 0
    });
    setNovoProf({ nome: '', especialidade: 'Mecânico', valorHora: 0 });
  };

  const handleAddBox = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoBoxNome) return;
    adicionarBox({
      box: novoBoxNome,
      os: '',
      veiculo: '',
      mecanico: '— Livre —',
      inicio: '',
      fim: '',
      status: 'Disponível'
    });
    setNovoBoxNome('');
  };

  return (
    <DefaultLayout>
      <div className="max-w-5xl mx-auto flex flex-col h-full">
        <PageHeader 
          title="🛠️ Configurações da Oficina" 
          subtitle="Gerencie sua equipe técnica e infraestrutura física" 
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          
          {/* Seção Equipe */}
          <div className="space-y-6">
            <Card padding="md">
              <h2 className="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
                👥 Equipe Técnica
              </h2>
              
              <form onSubmit={handleAddProf} className="flex flex-col sm:flex-row gap-2 mb-6 w-full">
                <input 
                  type="text"
                  placeholder="Nome do profissional"
                  value={novoProf.nome}
                  onChange={e => setNovoProf({...novoProf, nome: e.target.value})}
                  className="flex-1 w-full bg-surface-800 border border-surface-700 text-surface-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                />
                <div className="flex gap-2 w-full sm:w-auto">
                  <select 
                    value={novoProf.especialidade}
                    onChange={e => setNovoProf({...novoProf, especialidade: e.target.value as any})}
                    className="flex-1 sm:flex-none bg-surface-800 border border-surface-700 text-surface-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                  >
                    <option value="Supervisor">Supervisor</option>
                    <option value="Mecânico">Mecânico</option>
                    <option value="Eletricista">Eletricista</option>
                    <option value="Meceletri">Meceletri</option>
                  </select>
                  <input 
                    type="number"
                    placeholder="R$/h"
                    value={novoProf.valorHora || ''}
                    onChange={e => setNovoProf({...novoProf, valorHora: Number(e.target.value)})}
                    className="w-20 sm:w-24 bg-surface-800 border border-surface-700 text-surface-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                    step="0.01"
                    min="0"
                  />
                  <button className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                    +
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                {equipe.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-surface-800 border border-surface-700 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-surface-100">{p.nome}</p>
                      <p className="text-xs text-surface-500">
                        {p.especialidade} • {p.valorHora ? `R$ ${p.valorHora.toFixed(2)}/h` : 'R$ 0,00/h'}
                      </p>
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
            </Card>
          </div>

          {/* Seção Boxes */}
          <div className="space-y-6">
            <Card padding="md">
              <h2 className="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
                📦 Boxes e Rampas
              </h2>
              
              <form onSubmit={handleAddBox} className="flex flex-col sm:flex-row gap-2 mb-6 w-full">
                <input 
                  type="text"
                  placeholder="Ex: Box 05 ou Rampa 02"
                  value={novoBoxNome}
                  onChange={e => setNovoBoxNome(e.target.value)}
                  className="flex-1 w-full bg-surface-800 border border-surface-700 text-surface-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
                />
                <button className="w-full sm:w-auto whitespace-nowrap bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
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
            </Card>
          </div>

        </div>
      </div>
    </DefaultLayout>
  );
}
