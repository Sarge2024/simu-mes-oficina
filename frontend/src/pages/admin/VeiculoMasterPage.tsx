import { useEffect } from 'react';
import { useVehicleStore } from '../../store/useVehicleStore';
import DefaultLayout from '../../layouts/DefaultLayout';

export default function VeiculoMasterPage() {
  const { 
    veiculoAtual, 
    listaMarcas, 
    listaModelosFiltrados, 
    listaClientes, 
    isLoading, 
    isSaving,
    error,
    carregarMarcas, 
    carregarClientes, 
    selecionarMarca, 
    selecionarModelo,
    atualizarCampoVeiculo, 
    buscarVeiculoPorPlaca, 
    salvarVeiculo,
    resetForm
  } = useVehicleStore();

  useEffect(() => {
    carregarMarcas();
    carregarClientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    await salvarVeiculo();
  };

  const clienteSelecionado = listaClientes.find(c => c.id === veiculoAtual.cliente);

  // Mock dados para a timeline, já que o módulo de OS ainda está em desenvolvimento
  const mockHistorico = [
    { id: 1, data: '10/04/2026', servico: 'Revisão 50.000km', km: 50120, valor: 'R$ 1.250,00' },
    { id: 2, data: '15/11/2025', servico: 'Troca de Pastilhas', km: 42300, valor: 'R$ 480,00' },
    { id: 3, data: '05/03/2025', servico: 'Alinhamento/Balanceamento', km: 35000, valor: 'R$ 120,00' },
  ];

  return (
    <DefaultLayout>
      <div className="p-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-100 flex items-center gap-3">
            Cadastro Veículos
            {veiculoAtual.placa && (
              <span className="px-3 py-1 bg-surface-800 text-primary-400 rounded-md text-xl border border-surface-700">
                {veiculoAtual.placa}
              </span>
            )}
          </h1>
          <p className="text-surface-400 mt-1">Cadastre ou edite informações de frota e proprietários</p>
        </div>
        
        <div className="flex items-center gap-3">
          {clienteSelecionado && clienteSelecionado.limite_credito === '0.00' && (
            <span className="px-3 py-1.5 bg-danger-500/20 text-danger-400 border border-danger-500/30 rounded-lg text-sm font-semibold flex items-center gap-2">
              <span>⚠️</span> CLIENTE BLOQUEADO
            </span>
          )}
          
          <button 
            type="button"
            onClick={resetForm}
            className="px-4 py-2 bg-surface-800 text-surface-200 rounded-lg text-sm font-medium hover:bg-surface-700 transition-colors border border-surface-700"
          >
            Novo Veículo
          </button>
          <button 
            type="submit"
            form="veiculo-form"
            disabled={isSaving}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(99,102,241,0.4)]"
          >
            {isSaving ? 'Salvando...' : 'Salvar Veículo'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-danger-500/20 border border-danger-500/30 rounded-lg text-danger-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-8">
        
        {/* Coluna Principal: Formulário (2/3) */}
        <div className="col-span-2 space-y-8">
          <form id="veiculo-form" onSubmit={handleSalvar} className="space-y-8">
            
            {/* Seção A: Identificação Principal */}
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-surface-100 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center text-sm">A</span>
                Identificação Principal
              </h2>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Placa *
                  </label>
                  <input 
                    type="text" 
                    value={veiculoAtual.placa}
                    onChange={(e) => atualizarCampoVeiculo('placa', e.target.value)}
                    onBlur={(e) => buscarVeiculoPorPlaca(e.target.value)}
                    placeholder="AAA-0000 ou AAA0A00"
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-4 py-2.5 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all uppercase placeholder:normal-case"
                    required
                  />
                  {isLoading && <p className="text-xs text-primary-400 mt-1">Buscando veículo...</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Chassi (VIN) *
                  </label>
                  <input 
                    type="text" 
                    value={veiculoAtual.chassi}
                    onChange={(e) => atualizarCampoVeiculo('chassi', e.target.value)}
                    placeholder="17 caracteres"
                    maxLength={17}
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-4 py-2.5 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all uppercase placeholder:normal-case"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Cliente Proprietário *
                  </label>
                  <select
                    value={veiculoAtual.cliente || ''}
                    onChange={(e) => atualizarCampoVeiculo('cliente', parseInt(e.target.value))}
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-4 py-2.5 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">Selecione um cliente...</option>
                    {listaClientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nome_razao} ({c.cpf_cnpj})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Seção B: Taxonomia Relacional */}
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-surface-100 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center text-sm">B</span>
                Especificações Técnicas
              </h2>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Marca *
                  </label>
                  <select
                    value={veiculoAtual.marcaId || ''}
                    onChange={(e) => selecionarMarca(parseInt(e.target.value))}
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-4 py-2.5 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">Selecione a marca...</option>
                    {listaMarcas.map(m => (
                      <option key={m.id} value={m.id}>{m.nome_marca}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Modelo *
                  </label>
                  <select
                    value={veiculoAtual.modeloId || ''}
                    onChange={(e) => selecionarModelo(parseInt(e.target.value))}
                    disabled={!veiculoAtual.marcaId}
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-4 py-2.5 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="">{veiculoAtual.marcaId ? 'Selecione o modelo...' : 'Selecione a marca primeiro'}</option>
                    {listaModelosFiltrados.map(m => (
                      <option key={m.id} value={m.id}>{m.nome_modelo} ({m.categoria_veiculo})</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-surface-300 mb-1.5 flex justify-between">
                    <span>Versão / Motorização *</span>
                    {veiculoAtual.versao && (() => {
                      const versaoSelecionada = useVehicleStore.getState().listaVersoesFiltradas.find(v => v.id === veiculoAtual.versao);
                      if (versaoSelecionada) {
                        return (
                          <span className="flex gap-2">
                            {versaoSelecionada.codigo_fipe && <span className="bg-surface-800 px-2 py-0.5 rounded text-xs text-primary-400 border border-surface-700">FIPE: {versaoSelecionada.codigo_fipe}</span>}
                            <span className="bg-surface-800 px-2 py-0.5 rounded text-xs text-surface-400 border border-surface-700">Combustível: {versaoSelecionada.combustivel}</span>
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </label>
                  <select
                    value={veiculoAtual.versao || ''}
                    onChange={(e) => atualizarCampoVeiculo('versao', parseInt(e.target.value))}
                    disabled={!veiculoAtual.modeloId}
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-4 py-2.5 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="">{veiculoAtual.modeloId ? 'Selecione a versão...' : 'Selecione o modelo primeiro'}</option>
                    {useVehicleStore.getState().listaVersoesFiltradas.map(v => (
                      <option key={v.id} value={v.id}>{v.nome_versao} {v.motorizacao ? `(${v.motorizacao})` : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Ano de Fabricação / Modelo
                  </label>
                  <input 
                    type="number" 
                    value={veiculoAtual.ano_fabricacao}
                    onChange={(e) => atualizarCampoVeiculo('ano_fabricacao', e.target.value)}
                    placeholder="Ex: 2024"
                    min="1950"
                    max="2100"
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-4 py-2.5 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Cor
                  </label>
                  <input 
                    type="text" 
                    value={veiculoAtual.cor}
                    onChange={(e) => atualizarCampoVeiculo('cor', e.target.value)}
                    placeholder="Ex: Branco"
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-4 py-2.5 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Seção C: Métricas Operacionais */}
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-surface-100 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center text-sm">C</span>
                Métricas Operacionais
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">
                  Quilometragem (KM) Atual
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={veiculoAtual.km}
                    onChange={(e) => atualizarCampoVeiculo('km', e.target.value)}
                    placeholder="Ex: 50000"
                    min="0"
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg pl-4 pr-12 py-2.5 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-surface-500 font-medium">
                    KM
                  </div>
                </div>
                <p className="text-xs text-surface-500 mt-2">
                  Esta métrica é atualizada automaticamente no fechamento de OS para manter a curva de desgaste do veículo.
                </p>
              </div>
            </div>

          </form>
        </div>

        {/* Coluna Secundária: Painel Analítico (1/3) */}
        <div className="col-span-1 space-y-6">
          
          {/* Card: Proprietário Atual */}
          <div className="bg-surface-900 border border-surface-800 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary-500"></div>
            <h3 className="text-sm font-medium text-surface-400 uppercase tracking-wider mb-4">Proprietário Atual</h3>
            
            {clienteSelecionado ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-surface-800 flex items-center justify-center text-xl font-bold text-surface-200">
                    {clienteSelecionado.nome_razao.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-surface-100">{clienteSelecionado.nome_razao}</p>
                    <p className="text-xs text-surface-500">{clienteSelecionado.cpf_cnpj}</p>
                  </div>
                </div>
                
                <button className="w-full py-2 bg-surface-800 hover:bg-surface-700 text-primary-400 text-sm font-medium rounded-lg transition-colors border border-surface-700">
                  Abrir Ficha do Cliente ↗
                </button>
              </div>
            ) : (
              <div className="text-center py-6 text-surface-500 text-sm">
                Selecione um cliente no formulário para visualizar os detalhes.
              </div>
            )}
          </div>

          {/* Card: Linha do Tempo */}
          <div className="bg-surface-900 border border-surface-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-medium text-surface-400 uppercase tracking-wider">Histórico Recente</h3>
              <button className="text-xs text-primary-400 hover:text-primary-300 font-medium">Ver tudo</button>
            </div>
            
            {veiculoAtual.id ? (
              <div className="space-y-6">
                {mockHistorico.map((item, index) => (
                  <div key={item.id} className="relative pl-6">
                    {/* Timeline line */}
                    {index !== mockHistorico.length - 1 && (
                      <div className="absolute left-2 top-6 bottom-[-24px] w-[1px] bg-surface-700"></div>
                    )}
                    
                    {/* Timeline dot */}
                    <div className="absolute left-[5px] top-1.5 w-2 h-2 rounded-full bg-primary-500"></div>
                    
                    <div className="bg-surface-950 border border-surface-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-primary-400">{item.data}</span>
                        <span className="text-xs font-medium text-success-400">{item.valor}</span>
                      </div>
                      <p className="text-sm text-surface-100 font-medium">{item.servico}</p>
                      <p className="text-xs text-surface-500 mt-1">{item.km.toLocaleString('pt-BR')} km</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-surface-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">📋</span>
                </div>
                <p className="text-sm text-surface-400">
                  Cadastre ou busque o veículo para visualizar o histórico de serviços.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
    </DefaultLayout>
  );
}
