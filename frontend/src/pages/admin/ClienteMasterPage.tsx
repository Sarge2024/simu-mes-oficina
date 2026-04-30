import { useEffect } from 'react';
import { useClienteStore } from '../../store/useClienteStore';
import DefaultLayout from '../../layouts/DefaultLayout';

export default function ClienteMasterPage() {
  const { 
    clienteAtual, 
    listaClientes, 
    isLoading, 
    isSaving,
    error,
    carregarClientes, 
    selecionarCliente,
    atualizarCampoCliente, 
    salvarCliente,
    resetForm
  } = useClienteStore();

  useEffect(() => {
    carregarClientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    await salvarCliente();
  };

  return (
    <DefaultLayout>
      <div className="p-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-100 flex items-center gap-3">
            Gestão de Clientes
            {clienteAtual.id && (
              <span className="px-3 py-1 bg-surface-800 text-primary-400 rounded-md text-xl border border-surface-700">
                ID: {clienteAtual.id}
              </span>
            )}
          </h1>
          <p className="text-surface-400 mt-1">Cadastre ou edite informações de clientes</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={resetForm}
            className="px-4 py-2 bg-surface-800 text-surface-200 rounded-lg text-sm font-medium hover:bg-surface-700 transition-colors border border-surface-700"
          >
            Novo Cliente
          </button>
          <button 
            type="submit"
            form="cliente-form"
            disabled={isSaving}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(99,102,241,0.4)]"
          >
            {isSaving ? 'Salvando...' : 'Salvar Cliente'}
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
          <form id="cliente-form" onSubmit={handleSalvar} className="space-y-8">
            
            {/* Seção A: Identificação Principal */}
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-semibold text-surface-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center text-sm">A</span>
                  Dados Pessoais / Empresariais
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-surface-400">Status:</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={clienteAtual.ativo !== false}
                      onChange={(e) => atualizarCampoCliente('ativo', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-surface-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    <span className="ml-3 text-sm font-medium text-surface-300">
                      {clienteAtual.ativo !== false ? 'Ativo' : 'Inativo'}
                    </span>
                  </label>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Nome / Razão Social *
                  </label>
                  <input 
                    type="text" 
                    value={clienteAtual.nome_razao}
                    onChange={(e) => atualizarCampoCliente('nome_razao', e.target.value)}
                    placeholder="Nome completo ou Razão Social"
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-4 py-2.5 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    CPF / CNPJ *
                  </label>
                  <input 
                    type="text" 
                    value={clienteAtual.cpf_cnpj}
                    onChange={(e) => atualizarCampoCliente('cpf_cnpj', e.target.value)}
                    placeholder="Apenas números ou com formatação"
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-4 py-2.5 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Categoria do Contrato
                  </label>
                  <select
                    value={clienteAtual.categoria_contrato}
                    onChange={(e) => atualizarCampoCliente('categoria_contrato', e.target.value)}
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-4 py-2.5 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="avulso">Avulso</option>
                    <option value="contrato">Contrato</option>
                    <option value="frotista">Frotista</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Seção B: Contato e Endereço */}
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-surface-100 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center text-sm">B</span>
                Contato e Endereço
              </h2>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Telefone
                  </label>
                  <input 
                    type="text" 
                    value={clienteAtual.telefone}
                    onChange={(e) => atualizarCampoCliente('telefone', e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-4 py-2.5 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    E-mail
                  </label>
                  <input 
                    type="email" 
                    value={clienteAtual.email}
                    onChange={(e) => atualizarCampoCliente('email', e.target.value)}
                    placeholder="email@exemplo.com"
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-4 py-2.5 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Endereço Completo
                  </label>
                  <textarea 
                    value={clienteAtual.endereco}
                    onChange={(e) => atualizarCampoCliente('endereco', e.target.value)}
                    placeholder="Rua, Número, Bairro, Cidade - UF, CEP"
                    rows={3}
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-4 py-2.5 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Seção C: Financeiro */}
            <div className="bg-surface-900 border border-surface-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-surface-100 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center text-sm">C</span>
                Informações Financeiras
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">
                  Limite de Crédito (R$)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-surface-500 font-medium">
                    R$
                  </div>
                  <input 
                    type="number" 
                    step="0.01"
                    value={clienteAtual.limite_credito}
                    onChange={(e) => atualizarCampoCliente('limite_credito', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg pl-10 pr-4 py-2.5 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
                <p className="text-xs text-surface-500 mt-2">
                  O limite define o valor máximo de OS que pode ser aprovada sem pagamento antecipado. 
                  Zero (0.00) bloqueia novos serviços a prazo.
                </p>
              </div>
            </div>

          </form>
        </div>

        {/* Coluna Secundária: Lista de Clientes (1/3) */}
        <div className="col-span-1 space-y-6">
          
          <div className="bg-surface-900 border border-surface-800 rounded-xl p-6 flex flex-col h-[calc(100vh-12rem)]">
            <h3 className="text-sm font-medium text-surface-400 uppercase tracking-wider mb-4 flex justify-between items-center">
              <span>Clientes Cadastrados</span>
              <span className="bg-surface-800 text-surface-300 text-xs py-0.5 px-2 rounded-full border border-surface-700">
                {listaClientes.length}
              </span>
            </h3>
            
            <div className="mb-4">
              <input 
                type="text" 
                placeholder="Buscar cliente..." 
                className="w-full bg-surface-950 border border-surface-800 rounded-lg px-4 py-2 text-sm text-surface-200 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {isLoading && listaClientes.length === 0 ? (
                <p className="text-sm text-surface-500 text-center py-4">Carregando...</p>
              ) : listaClientes.length > 0 ? (
                listaClientes.map((cliente) => (
                  <button
                    key={cliente.id}
                    onClick={() => selecionarCliente(cliente)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      clienteAtual.id === cliente.id
                        ? 'bg-primary-600/10 border-primary-500/50'
                        : 'bg-surface-950 border-surface-800 hover:border-surface-600'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium text-surface-100 truncate pr-2">
                        {cliente.nome_razao}
                      </p>
                      {!cliente.ativo && (
                        <span className="text-[10px] bg-danger-500/20 text-danger-400 px-1.5 py-0.5 rounded border border-danger-500/30">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-surface-500">{cliente.cpf_cnpj}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                        cliente.categoria_contrato === 'frotista' ? 'bg-info-500/10 text-info-400 border-info-500/20' :
                        cliente.categoria_contrato === 'contrato' ? 'bg-success-500/10 text-success-400 border-success-500/20' :
                        'bg-surface-800 text-surface-400 border-surface-700'
                      }`}>
                        {cliente.categoria_contrato.toUpperCase()}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-surface-500 text-center py-4">Nenhum cliente encontrado.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </DefaultLayout>
  );
}
