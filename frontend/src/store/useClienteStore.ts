import { create } from 'zustand';

// --- Types ---
export interface Cliente {
  id?: number;
  tipo_pessoa: string;
  is_cliente: boolean;
  is_fornecedor: boolean;
  nome_razao: string;
  apelido_fantasia?: string;
  cpf_cnpj: string;
  telefone: string;
  email: string;
  cep: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  limite_credito: string | number;
  categoria_contrato: string;
  ativo?: boolean;
}

interface ClienteStoreState {
  clienteAtual: Cliente;
  listaClientes: Cliente[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  carregarClientes: () => Promise<void>;
  selecionarCliente: (cliente: Cliente | null) => void;
  atualizarCampoCliente: (campo: keyof Cliente, valor: any) => void;
  salvarCliente: () => Promise<void>;
  excluirCliente: (id: number) => Promise<void>;
  buscarCep: (cep: string) => Promise<void>;
  resetForm: () => void;
}

const defaultCliente: Cliente = {
  tipo_pessoa: 'pf',
  is_cliente: true,
  is_fornecedor: false,
  nome_razao: '',
  apelido_fantasia: '',
  cpf_cnpj: '',
  telefone: '',
  email: '',
  cep: '',
  endereco: '',
  bairro: '',
  cidade: '',
  estado: '',
  limite_credito: 0,
  categoria_contrato: 'avulso',
  ativo: true
};

const API_BASE = '/api/django/api';

export const useClienteStore = create<ClienteStoreState>((set, get) => ({
  clienteAtual: { ...defaultCliente },
  listaClientes: [],
  isLoading: false,
  isSaving: false,
  error: null,

  carregarClientes: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/core/clientes/`);
      if (!res.ok) throw new Error('Falha ao carregar clientes');
      const data = await res.json();
      const clientes = Array.isArray(data) ? data : (data.results || []);
      set({ listaClientes: clientes, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  selecionarCliente: (cliente: Cliente | null) => {
    if (cliente) {
      set({ clienteAtual: { ...cliente }, error: null });
    } else {
      set({ clienteAtual: { ...defaultCliente }, error: null });
    }
  },

  atualizarCampoCliente: (campo: keyof Cliente, valor: any) => {
    set((state) => {
      const newState = {
        clienteAtual: { ...state.clienteAtual, [campo]: valor }
      };

      // Formatação simples para CPF/CNPJ (apenas limpeza de caracteres não numéricos) 
      // para envio, embora possamos manter a máscara visual no front.
      // Neste caso, manteremos o valor que vem do input.
      
      return newState;
    });
  },

  salvarCliente: async () => {
    const { clienteAtual, carregarClientes } = get();
    set({ isSaving: true, error: null });

    try {
      if (!clienteAtual.nome_razao || !clienteAtual.cpf_cnpj) {
        throw new Error('Preencha os campos obrigatórios (Nome/Razão Social e CPF/CNPJ).');
      }

      const method = clienteAtual.id ? 'PUT' : 'POST';
      const url = clienteAtual.id 
        ? `${API_BASE}/core/clientes/${clienteAtual.id}/` 
        : `${API_BASE}/core/clientes/`;

      const payload = {
        ...clienteAtual,
        limite_credito: parseFloat(clienteAtual.limite_credito.toString() || '0').toFixed(2)
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(JSON.stringify(errData));
      }

      const savedData = await res.json();
      set({ 
        clienteAtual: { ...savedData }, 
        isSaving: false 
      });
      
      await carregarClientes();
      alert('Cliente salvo com sucesso!');
      
    } catch (err: any) {
      set({ error: err.message, isSaving: false });
    }
  },

  excluirCliente: async (id: number) => {
    const { carregarClientes, resetForm } = get();
    set({ isLoading: true, error: null });

    try {
      const res = await fetch(`${API_BASE}/core/clientes/${id}/`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Falha ao excluir o cliente');
      }

      await carregarClientes();
      resetForm();
      alert('Cliente excluído com sucesso!');
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  buscarCep: async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        set((state) => ({
          clienteAtual: {
            ...state.clienteAtual,
            endereco: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            estado: data.uf || '',
          }
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  },

  resetForm: () => {
    set({ 
      clienteAtual: { ...defaultCliente }, 
      error: null 
    });
  }
}));
