import { create } from 'zustand';

// --- Types ---
export interface Cliente {
  id?: number;
  nome_razao: string;
  cpf_cnpj: string;
  telefone: string;
  email: string;
  endereco: string;
  limite_credito: string | number;
  categoria_contrato: 'avulso' | 'contrato' | 'frotista';
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
  resetForm: () => void;
}

const defaultCliente: Cliente = {
  nome_razao: '',
  cpf_cnpj: '',
  telefone: '',
  email: '',
  endereco: '',
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
      set({ listaClientes: data, isLoading: false });
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

  resetForm: () => {
    set({ 
      clienteAtual: { ...defaultCliente }, 
      error: null 
    });
  }
}));
