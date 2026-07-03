import { useEffect, useState, useMemo } from 'react';
import { useClienteStore } from '../../store/useClienteStore';
import { useVehicleStore, type Veiculo } from '../../store/useVehicleStore';
import { formatCPFCNPJ, isValidCPFCNPJ, formatarPlaca, validarPlaca } from '../../lib/formatters';
import DefaultLayout from '../../layouts/DefaultLayout';
import Card from '../../components/shared/Card';

interface ClienteVeiculo extends Veiculo {
  marca_id?: number;
  modelo_id?: number;
  marca_nome?: string;
  modelo_nome?: string;
}

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
    excluirCliente,
    buscarCep,
    resetForm
  } = useClienteStore();

  const {
    listaMarcas,
    listaCategorias,
    listaModelosFiltrados,
    listaVersoesFiltradas,
    carregarMarcas,
    carregarCategorias,
    selecionarMarca,
    selecionarModelo,
  } = useVehicleStore();

  const [searchTerm, setSearchTerm] = useState('');
  
  // Vehicle management states
  const [isVeiculoModalOpen, setIsVeiculoModalOpen] = useState(false);
  const [veiculosDoCliente, setVeiculosDoCliente] = useState<ClienteVeiculo[]>([]);
  const [veiculoFormState, setVeiculoFormState] = useState<ClienteVeiculo>({
    id: undefined,
    placa: '',
    chassi: '',
    cliente: null,
    versao: null,
    modeloId: null,
    marcaId: null,
    ano_fabricacao: '',
    cor: '',
    km: '',
    ativo: true
  });
  const [categoriaVeiculoAtiva, setCategoriaVeiculoAtiva] = useState<string>('');
  const [isSalvandoVeiculo, setIsSalvandoVeiculo] = useState(false);
  const [erroVeiculo, setErroVeiculo] = useState<string | null>(null);
  const [veiculoParaExcluir, setVeiculoParaExcluir] = useState<ClienteVeiculo | null>(null);
  const [isExcluindoVeiculo, setIsExcluindoVeiculo] = useState(false);

  const filteredClientes = useMemo(() => {
    if (!searchTerm) return listaClientes;
    const term = searchTerm.toLowerCase();
    return listaClientes.filter(c => 
      (c.nome_razao?.toLowerCase().includes(term)) || 
      (c.apelido_fantasia?.toLowerCase().includes(term)) ||
      (c.cpf_cnpj?.toLowerCase().includes(term)) ||
      (c.email?.toLowerCase().includes(term))
    );
  }, [listaClientes, searchTerm]);

  const carregarVeiculosDoCliente = async (clienteId: number) => {
    try {
      const res = await fetch(`/api/django/api/veiculos/ativos/?cliente=${clienteId}`);
      const data = await res.json();
      const results = Array.isArray(data) ? data : (data.results || []);
      setVeiculosDoCliente(results);
    } catch (err) {
      console.error("Erro ao carregar veículos do cliente:", err);
    }
  };

  useEffect(() => {
    carregarClientes();
    carregarMarcas();
    carregarCategorias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (clienteAtual.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      carregarVeiculosDoCliente(clienteAtual.id);
    } else {
      setVeiculosDoCliente([]);
    }
  }, [clienteAtual.id]);

  const handleConfirmarExclusao = async () => {
    if (!veiculoParaExcluir?.id) return;
    setIsExcluindoVeiculo(true);
    try {
      const res = await fetch(`/api/django/api/veiculos/ativos/${veiculoParaExcluir.id}/`, {
        method: 'DELETE'
      });

      if (res.status === 204) {
        // Exclusão permanente com sucesso
        if (clienteAtual.id) {
          carregarVeiculosDoCliente(clienteAtual.id);
        }
        setVeiculoParaExcluir(null);
        setErroVeiculo(null);
      } else if (res.ok) {
        // Soft delete — veículo desativado pois tem OS vinculada
        const data = await res.json().catch(() => null);
        if (clienteAtual.id) {
          carregarVeiculosDoCliente(clienteAtual.id);
        }
        setVeiculoParaExcluir(null);
        setErroVeiculo(data?.detail || 'Veículo desativado com sucesso.');
      } else {
        const errData = await res.json().catch(() => null);
        const msg = errData?.detail || 'Erro ao excluir veículo.';
        setErroVeiculo(msg);
      }
    } catch (err) {
      console.error(err);
      setErroVeiculo('Erro de conexão ao excluir veículo.');
    } finally {
      setIsExcluindoVeiculo(false);
    }
  };

  const handleAbrirModalVeiculo = async (veic?: ClienteVeiculo) => {
    setErroVeiculo(null);
    setCategoriaVeiculoAtiva('');
    if (veic) {
      if (veic.marca_id) {
        await selecionarMarca(veic.marca_id);
      }
      if (veic.modelo_id) {
        await selecionarModelo(veic.modelo_id);
      }
      setVeiculoFormState({
        id: veic.id,
        placa: veic.placa,
        chassi: veic.chassi,
        cliente: veic.cliente ?? null,
        versao: veic.versao ?? null,
        modeloId: veic.modelo_id ?? null,
        marcaId: veic.marca_id ?? null,
        ano_fabricacao: veic.ano_fabricacao || '',
        cor: veic.cor || '',
        km: veic.km || '',
        ativo: veic.ativo !== false
      });
    } else {
      setVeiculoFormState({
        id: undefined,
        placa: '',
        chassi: '',
        cliente: clienteAtual.id ?? null,
        versao: null,
        modeloId: null,
        marcaId: null,
        ano_fabricacao: '',
        cor: '',
        km: '',
        ativo: true
      });
    }
    setIsVeiculoModalOpen(true);
  };

  const handleBlurPlacaVeiculo = async (placa: string) => {
    const placaFormatada = formatarPlaca(placa);
    const valida = validarPlaca(placa);
    
    setVeiculoFormState((prev) => ({
      ...prev,
      placa: placaFormatada
    }));

    if (!valida) {
      setErroVeiculo('Placa em formato inválido. Use AAA-9999 (tradicional) ou AAA0A00 (Mercosul).');
      return;
    } else {
      setErroVeiculo(null);
    }

    try {
      const res = await fetch(`/api/django/api/veiculos/ativos/?placa=${placaFormatada}`);
      const data = await res.json();
      const results = Array.isArray(data) ? data : (data.results || []);
      
      if (results.length > 0) {
        const veic = results[0];
        if (veic.cliente !== clienteAtual.id) {
          setErroVeiculo(`Este veículo já está cadastrado para outro cliente (ID: ${veic.cliente}).`);
          return;
        }

        if (veic.marca_id) {
          await selecionarMarca(veic.marca_id);
        }
        if (veic.modelo_id) {
          await selecionarModelo(veic.modelo_id);
        }
        setVeiculoFormState({
          id: veic.id,
          placa: veic.placa,
          chassi: veic.chassi,
          cliente: veic.cliente,
          versao: veic.versao,
          modeloId: veic.modelo_id,
          marcaId: veic.marca_id,
          ano_fabricacao: veic.ano_fabricacao || '',
          cor: veic.cor || '',
          km: veic.km || '',
          ativo: veic.ativo !== false
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSalvarVeiculo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroVeiculo(null);
    setIsSalvandoVeiculo(true);

    try {
      if (!veiculoFormState.placa || !veiculoFormState.chassi || !veiculoFormState.versao) {
        throw new Error('Preencha os campos obrigatórios (Placa, Chassi e Versão).');
      }

      const placaFormatada = formatarPlaca(veiculoFormState.placa);
      const valida = validarPlaca(veiculoFormState.placa);
      if (!valida) {
        throw new Error('Placa em formato inválido. Use AAA-9999 (tradicional) ou AAA0A00 (Mercosul).');
      }

      const method = veiculoFormState.id ? 'PUT' : 'POST';
      const url = veiculoFormState.id 
        ? `/api/django/api/veiculos/ativos/${veiculoFormState.id}/` 
        : `/api/django/api/veiculos/ativos/`;

      const payload = {
        placa: placaFormatada,
        chassi: veiculoFormState.chassi.toUpperCase(),
        cliente: clienteAtual.id,
        versao: veiculoFormState.versao,
        ano_fabricacao: veiculoFormState.ano_fabricacao ? parseInt(String(veiculoFormState.ano_fabricacao)) : null,
        cor: veiculoFormState.cor,
        km: veiculoFormState.km ? parseInt(String(veiculoFormState.km)) : 0,
        ativo: true
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || errData.placa?.[0] || errData.chassi?.[0] || 'Erro ao salvar veículo');
      }

      setIsVeiculoModalOpen(false);
      if (clienteAtual.id) {
        carregarVeiculosDoCliente(clienteAtual.id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar veículo';
      setErroVeiculo(msg);
    } finally {
      setIsSalvandoVeiculo(false);
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação de CPF/CNPJ
    if (clienteAtual.cpf_cnpj && !isValidCPFCNPJ(clienteAtual.cpf_cnpj)) {
      alert('CPF ou CNPJ inválido. Por favor, verifique os dígitos.');
      return;
    }
    
    await salvarCliente();
  };

  return (
    <DefaultLayout>
      <div className="p-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-100 flex items-center gap-3">
            Parceiros de Negócios (Clientes e Fornecedores)
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
          {clienteAtual.id && (
            <button 
                type="button"
                onClick={() => {
                    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
                        excluirCliente(clienteAtual.id!);
                    }
                }}
                className="px-4 py-2 bg-danger-500/20 text-danger-400 border border-danger-500/30 rounded-lg text-sm font-semibold hover:bg-danger-500/30 transition-colors"
            >
                Excluir
            </button>
          )}
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
            <Card padding="md" className="border-surface-800">
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
                <div className="col-span-2 sm:col-span-1">
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

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Apelido / Nome Fantasia
                  </label>
                  <input 
                    type="text" 
                    value={clienteAtual.apelido_fantasia}
                    onChange={(e) => atualizarCampoCliente('apelido_fantasia', e.target.value)}
                    placeholder="Identificação coloquial"
                    className="w-full bg-surface-950 border border-surface-700 rounded-lg px-4 py-2.5 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div className="col-span-1 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-1.5">
                      Tipo de Pessoa *
                    </label>
                    <select
                      value={clienteAtual.tipo_pessoa || 'pf'}
                      onChange={(e) => atualizarCampoCliente('tipo_pessoa', e.target.value)}
                      className="w-full bg-surface-950 border border-surface-700 rounded-lg px-4 py-2.5 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    >
                      <option value="pf">Pessoa Física (CPF)</option>
                      <option value="pj">Pessoa Jurídica (CNPJ)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-1.5">
                      {clienteAtual.tipo_pessoa === 'pj' ? 'CNPJ' : 'CPF'} *
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={formatCPFCNPJ(clienteAtual.cpf_cnpj)}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (clienteAtual.tipo_pessoa === 'pf' && val.length > 11) val = val.slice(0, 11);
                          if (clienteAtual.tipo_pessoa === 'pj' && val.length > 14) val = val.slice(0, 14);
                          atualizarCampoCliente('cpf_cnpj', val);
                        }}
                        placeholder={clienteAtual.tipo_pessoa === 'pj' ? "00.000.000/0000-00" : "000.000.000-00"}
                        className={`w-full bg-surface-950 border rounded-lg px-4 py-2.5 text-surface-100 focus:outline-none focus:ring-2 transition-all ${
                          clienteAtual.cpf_cnpj && !isValidCPFCNPJ(clienteAtual.cpf_cnpj)
                            ? 'border-danger-500 focus:ring-danger-500/50'
                            : 'border-surface-700 focus:ring-primary-500'
                        }`}
                        required
                      />
                    </div>
                    {clienteAtual.cpf_cnpj && !isValidCPFCNPJ(clienteAtual.cpf_cnpj) && (
                      <p className="text-[10px] text-danger-400 mt-1 font-medium">
                        ⚠️ Número inválido.
                      </p>
                    )}
                  </div>
                </div>

                <div className="col-span-1 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-1.5">
                      Tipo de Parceiro *
                    </label>
                    <select
                      value={
                        clienteAtual.is_cliente && clienteAtual.is_fornecedor ? 'ambos' :
                        clienteAtual.is_fornecedor ? 'fornecedor' : 'cliente'
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        atualizarCampoCliente('is_cliente', val === 'cliente' || val === 'ambos');
                        atualizarCampoCliente('is_fornecedor', val === 'fornecedor' || val === 'ambos');
                      }}
                      className="w-full bg-surface-950 border border-surface-700 rounded-lg px-4 py-2.5 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    >
                      <option value="cliente">Cliente (Consumidor)</option>
                      <option value="fornecedor">Fornecedor (Peças/Serviços)</option>
                      <option value="ambos">Cliente e Fornecedor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-1.5">
                      Categoria do Contrato
                    </label>
                    <select
                      value={clienteAtual.categoria_contrato}
                      onChange={(e) => atualizarCampoCliente('categoria_contrato', e.target.value)}
                      className="w-full bg-surface-950 border border-surface-700 rounded-lg px-4 py-2.5 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                      required
                    >
                      <option value="avulso">Avulso</option>
                      <option value="frota">Frota</option>
                      <option value="seguradora">Seguradora</option>
                    </select>
                  </div>
                </div>


              </div>
            </Card>

            {/* Seção B: Contato e Endereço */}
            <Card padding="md" className="border-surface-800">
              <h2 className="text-lg font-semibold text-surface-100 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center text-sm">B</span>
                Contato e Localização
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

                <div className="col-span-2 grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-surface-800/50">
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-1.5">
                      CEP
                    </label>
                    <input 
                      type="text" 
                      value={clienteAtual.cep}
                      onChange={(e) => {
                        const val = e.target.value;
                        atualizarCampoCliente('cep', val);
                        if (val.replace(/\D/g, '').length === 8) {
                          buscarCep(val);
                        }
                      }}
                      onBlur={(e) => buscarCep(e.target.value)}
                      placeholder="00000-000"
                      className="w-full bg-surface-950 border border-surface-700 rounded-lg px-4 py-2 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-1.5">
                      Logradouro / Número
                    </label>
                    <input 
                      type="text" 
                      value={clienteAtual.endereco}
                      onChange={(e) => atualizarCampoCliente('endereco', e.target.value)}
                      placeholder="Rua, Avenida, etc + Número"
                      className="w-full bg-surface-950 border border-surface-700 rounded-lg px-4 py-2 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-1.5">
                      Bairro
                    </label>
                    <input 
                      type="text" 
                      value={clienteAtual.bairro}
                      onChange={(e) => atualizarCampoCliente('bairro', e.target.value)}
                      placeholder="Nome do bairro"
                      className="w-full bg-surface-950 border border-surface-700 rounded-lg px-4 py-2 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-1.5">
                      Cidade
                    </label>
                    <input 
                      type="text" 
                      value={clienteAtual.cidade}
                      onChange={(e) => atualizarCampoCliente('cidade', e.target.value)}
                      placeholder="Cidade"
                      className="w-full bg-surface-950 border border-surface-700 rounded-lg px-4 py-2 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-1.5">
                      Estado (UF)
                    </label>
                    <input 
                      type="text" 
                      value={clienteAtual.estado}
                      onChange={(e) => atualizarCampoCliente('estado', e.target.value.toUpperCase())}
                      maxLength={2}
                      placeholder="SP"
                      className="w-full bg-surface-950 border border-surface-700 rounded-lg px-4 py-2 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm text-center font-bold"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Seção C: Financeiro */}
            <Card padding="md" className="border-surface-800">
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
            </Card>

          </form>

          {/* Seção D: Veículos Associados */}
          {clienteAtual.id && (
            <Card padding="md" className="border-surface-800 mt-8">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-semibold text-surface-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center text-sm">D</span>
                  Veículos do Cliente
                </h2>
                <button
                  type="button"
                  onClick={() => handleAbrirModalVeiculo()}
                  className="px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                >
                  <span>➕</span> Adicionar Veículo
                </button>
              </div>

              {veiculosDoCliente.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-surface-800 text-surface-500 text-xs uppercase tracking-wider font-semibold">
                        <th className="pb-3">Placa</th>
                        <th className="pb-3">Versão / Modelo</th>
                        <th className="pb-3">Ano</th>
                        <th className="pb-3">Cor</th>
                        <th className="pb-3">KM</th>
                        <th className="pb-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-800/50">
                      {veiculosDoCliente.map((veic) => (
                        <tr key={veic.id} className="text-surface-200 hover:bg-surface-800/10 transition-colors">
                          <td className="py-3 font-mono text-xs text-primary-400 font-semibold">{veic.placa}</td>
                          <td className="py-3">
                            <span className="block font-medium text-surface-100">
                              {veic.marca_nome} {veic.modelo_nome} - {veic.versao_nome || 'Versão não identificada'}
                            </span>
                            <span className="text-[10px] text-surface-500">Chassi: {veic.chassi}</span>
                          </td>
                          <td className="py-3">{veic.ano_fabricacao || '—'}</td>
                          <td className="py-3 capitalize">{veic.cor || '—'}</td>
                          <td className="py-3 font-mono text-xs">{veic.km ? `${Number(veic.km).toLocaleString('pt-BR')} km` : '—'}</td>
                          <td className="py-3 text-right space-x-3">
                            <button
                              type="button"
                              onClick={() => handleAbrirModalVeiculo(veic)}
                              className="text-xs text-primary-400 hover:text-primary-300 font-medium transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => setVeiculoParaExcluir(veic)}
                              className="text-xs text-danger-400 hover:text-danger-300 font-medium transition-colors"
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center border border-dashed border-surface-800 rounded-xl">
                  <p className="text-sm text-surface-500 italic">Nenhum veículo cadastrado para este cliente.</p>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Modal de Veículo */}
        {isVeiculoModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface-900 border border-surface-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleIn">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-surface-800 flex justify-between items-center bg-surface-900/50">
                <h3 className="text-lg font-bold text-surface-100 flex items-center gap-2">
                  <span>🚗</span>
                  {veiculoFormState.id ? 'Editar Veículo' : 'Adicionar Novo Veículo'}
                </h3>
                <button 
                  type="button"
                  onClick={() => setIsVeiculoModalOpen(false)}
                  className="text-surface-400 hover:text-surface-200 transition-colors text-xl"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSalvarVeiculo}>
                {/* Modal Body */}
                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  {erroVeiculo && (
                    <div className="p-3 bg-danger-500/10 border border-danger-500/20 text-danger-400 rounded-lg text-xs font-medium">
                      {erroVeiculo}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {/* Placa */}
                    <div>
                      <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">
                        Placa *
                      </label>
                      <input 
                        type="text" 
                        value={veiculoFormState.placa}
                        onChange={(e) => setVeiculoFormState((prev) => ({ ...prev, placa: e.target.value }))}
                        onBlur={(e) => handleBlurPlacaVeiculo(e.target.value)}
                        placeholder="AAA-0000 ou AAA0A00"
                        className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3.5 py-2 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all uppercase placeholder:normal-case font-semibold text-sm"
                        required
                      />
                    </div>

                    {/* Chassi */}
                    <div>
                      <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">
                        Chassi (VIN) *
                      </label>
                      <input 
                        type="text" 
                        value={veiculoFormState.chassi}
                        onChange={(e) => setVeiculoFormState((prev) => ({ ...prev, chassi: e.target.value }))}
                        placeholder="17 caracteres"
                        maxLength={17}
                        className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3.5 py-2 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all uppercase placeholder:normal-case text-sm"
                        required
                      />
                    </div>

                    {/* Categoria */}
                    <div>
                      <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">
                        Categoria
                      </label>
                      <select
                        value={categoriaVeiculoAtiva}
                        onChange={(e) => setCategoriaVeiculoAtiva(e.target.value)}
                        className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3.5 py-2 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"
                      >
                        <option value="">Todas as categorias...</option>
                        {listaCategorias.map(c => (
                          <option key={c.id} value={String(c.id)}>{c.nome}</option>
                        ))}
                      </select>
                    </div>

                    {/* Marca */}
                    <div>
                      <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">
                        Marca *
                      </label>
                      <select
                        value={veiculoFormState.marcaId || ''}
                        onChange={async (e) => {
                          const val = parseInt(e.target.value);
                          setVeiculoFormState((prev) => ({ ...prev, marcaId: val, modeloId: null, versao: null }));
                          await selecionarMarca(val);
                        }}
                        className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3.5 py-2 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"
                        required
                      >
                        <option value="">Selecione a marca...</option>
                        {listaMarcas.filter(m => m.ativo).map(m => (
                          <option key={m.id} value={m.id}>{m.nome_marca}</option>
                        ))}
                      </select>
                    </div>

                    {/* Modelo */}
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">
                        Modelo *
                      </label>
                      <select
                        value={veiculoFormState.modeloId || ''}
                        onChange={async (e) => {
                          const val = parseInt(e.target.value);
                          setVeiculoFormState((prev) => ({ ...prev, modeloId: val, versao: null }));
                          await selecionarModelo(val);
                        }}
                        disabled={!veiculoFormState.marcaId}
                        className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3.5 py-2 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        required
                      >
                        <option value="">{veiculoFormState.marcaId ? 'Selecione o modelo...' : 'Selecione a marca primeiro'}</option>
                        {listaModelosFiltrados
                          .filter(m => !categoriaVeiculoAtiva || String(m.categoria) === categoriaVeiculoAtiva)
                          .map(m => (
                            <option key={m.id} value={m.id}>{m.nome_modelo} {m.categoria_nome ? `(${m.categoria_nome})` : ''}</option>
                          ))}
                      </select>
                    </div>

                    {/* Versão */}
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">
                        Versão *
                      </label>
                      <select
                        value={veiculoFormState.versao || ''}
                        onChange={(e) => setVeiculoFormState((prev) => ({ ...prev, versao: parseInt(e.target.value) }))}
                        disabled={!veiculoFormState.modeloId}
                        className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3.5 py-2 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        required
                      >
                        <option value="">{veiculoFormState.modeloId ? 'Selecione a versão...' : 'Selecione o modelo primeiro'}</option>
                        {listaVersoesFiltradas.map(v => (
                          <option key={v.id} value={v.id}>{v.nome_versao} {v.motorizacao ? `(${v.motorizacao})` : ''}</option>
                        ))}
                      </select>
                    </div>

                    {/* Ano Fabricação */}
                    <div>
                      <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">
                        Ano Fabricação
                      </label>
                      <input 
                        type="number" 
                        value={veiculoFormState.ano_fabricacao}
                        onChange={(e) => setVeiculoFormState((prev) => ({ ...prev, ano_fabricacao: e.target.value }))}
                        placeholder="Ex: 2015"
                        min="1900"
                        max={new Date().getFullYear() + 2}
                        className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3.5 py-2 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"
                      />
                    </div>

                    {/* Cor */}
                    <div>
                      <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">
                        Cor
                      </label>
                      <input 
                        type="text" 
                        value={veiculoFormState.cor}
                        onChange={(e) => setVeiculoFormState((prev) => ({ ...prev, cor: e.target.value }))}
                        placeholder="Ex: Prata"
                        className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3.5 py-2 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"
                      />
                    </div>

                    {/* Quilometragem (KM) */}
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">
                        Quilometragem (KM)
                      </label>
                      <input 
                        type="number" 
                        value={veiculoFormState.km}
                        onChange={(e) => setVeiculoFormState((prev) => ({ ...prev, km: e.target.value }))}
                        placeholder="Ex: 85000"
                        min="0"
                        className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3.5 py-2 text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-surface-800 flex justify-end gap-3 bg-surface-900/50">
                  <button
                    type="button"
                    onClick={() => setIsVeiculoModalOpen(false)}
                    className="px-4 py-2 bg-surface-800 text-surface-200 hover:bg-surface-700 rounded-lg text-sm font-medium transition-colors border border-surface-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSalvandoVeiculo}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                  >
                    {isSalvandoVeiculo ? 'Salvando...' : 'Salvar Veículo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Confirmação de Exclusão de Veículo */}
        {veiculoParaExcluir && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-surface-900 border border-surface-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleIn">
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-danger-500/10 rounded-full flex items-center justify-center">
                  <span className="text-3xl">⚠️</span>
                </div>
                <h3 className="text-lg font-bold text-surface-50 mb-2">Confirmar Exclusão</h3>
                <p className="text-sm text-surface-400 mb-1">
                  Deseja realmente excluir o veículo?
                </p>
                <div className="bg-surface-950 rounded-lg p-3 mt-3 border border-surface-800">
                  <p className="font-mono text-primary-400 font-bold text-sm">{veiculoParaExcluir.placa}</p>
                  <p className="text-xs text-surface-300 mt-1">
                    {veiculoParaExcluir.marca_nome} {veiculoParaExcluir.modelo_nome} — {veiculoParaExcluir.versao_nome || 'Versão não identificada'}
                  </p>
                  {veiculoParaExcluir.chassi && (
                    <p className="text-[10px] text-surface-500 mt-1">Chassi: {veiculoParaExcluir.chassi}</p>
                  )}
                </div>
                <p className="text-xs text-danger-400/80 mt-3">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
              <div className="px-6 py-4 border-t border-surface-800 flex justify-end gap-3 bg-surface-900/50">
                <button
                  type="button"
                  onClick={() => { setVeiculoParaExcluir(null); setErroVeiculo(null); }}
                  disabled={isExcluindoVeiculo}
                  className="px-4 py-2 bg-surface-800 text-surface-200 hover:bg-surface-700 rounded-lg text-sm font-medium transition-colors border border-surface-700 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarExclusao}
                  disabled={isExcluindoVeiculo}
                  className="px-4 py-2 bg-danger-600 hover:bg-danger-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                >
                  {isExcluindoVeiculo ? 'Excluindo...' : 'Confirmar Exclusão'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Coluna Secundária: Lista de Clientes (1/3) */}
        <div className="col-span-1 space-y-6">
          <Card padding="md" className="flex flex-col h-[calc(100vh-12rem)] border-surface-800">
            <h3 className="text-sm font-medium text-surface-400 uppercase tracking-wider mb-4 flex justify-between items-center">
              <span>Clientes Cadastrados</span>
              <span className="bg-surface-800 text-surface-300 text-xs py-0.5 px-2 rounded-full border border-surface-700">
                {listaClientes.length}
              </span>
            </h3>
            
            <div className="mb-4">
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente..." 
                className="w-full bg-surface-950 border border-surface-800 rounded-lg px-4 py-2 text-sm text-surface-200 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {isLoading && listaClientes.length === 0 ? (
                <p className="text-sm text-surface-500 text-center py-4">Carregando...</p>
              ) : filteredClientes.length > 0 ? (
                filteredClientes.map((cliente) => (
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
                        {cliente.nome_razao} {cliente.apelido_fantasia && <span className="text-primary-400 opacity-80 text-xs"> — {cliente.apelido_fantasia}</span>}
                      </p>
                      {!cliente.ativo && (
                        <span className="text-[10px] bg-danger-500/20 text-danger-400 px-1.5 py-0.5 rounded border border-danger-500/30">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-surface-500">{formatCPFCNPJ(cliente.cpf_cnpj)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${
                        cliente.is_cliente && cliente.is_fornecedor ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        cliente.is_fornecedor ? 'bg-warning-500/10 text-warning-400 border-warning-500/20' :
                        'bg-success-500/10 text-success-400 border-success-500/20'
                      }`}>
                        {cliente.is_cliente && cliente.is_fornecedor ? 'CLIENTE E FORNECEDOR' : 
                         cliente.is_fornecedor ? 'FORNECEDOR' : 'CLIENTE'}
                      </span>
                      {cliente.is_cliente && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                          cliente.categoria_contrato === 'frota' ? 'bg-info-500/10 text-info-400 border-info-500/20' :
                          cliente.categoria_contrato === 'seguradora' ? 'bg-danger-500/10 text-danger-400 border-danger-500/20' :
                          'bg-surface-800 text-surface-400 border-surface-700'
                        }`}>
                          {cliente.categoria_contrato.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-surface-500 text-center py-4">Nenhum cliente encontrado.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
    </DefaultLayout>
  );
}
