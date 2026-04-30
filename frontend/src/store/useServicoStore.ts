import { create } from 'zustand';

export interface Servico {
  id?: number;
  codigo: string;
  descricao: string;
  tempo_padrao: number | string;
  preco_base: number | string;
  especialidade: string;
  ativo: boolean;
}

interface ServicoStoreState {
  servicoAtual: Servico;
  listaServicos: Servico[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  carregarServicos: () => Promise<void>;
  atualizarCampo: (campo: keyof Servico, valor: any) => void;
  selecionarServico: (id: number) => Promise<void>;
  salvarServico: () => Promise<void>;
  excluirServico: (id: number) => Promise<void>;
  resetForm: () => void;
}

const defaultServico: Servico = {
  codigo: '',
  descricao: '',
  tempo_padrao: 1,
  preco_base: 0,
  especialidade: '',
  ativo: true
};

const API_BASE = '/api/django/api';

export const useServicoStore = create<ServicoStoreState>((set, get) => ({
  servicoAtual: { ...defaultServico },
  listaServicos: [],
  isLoading: false,
  isSaving: false,
  error: null,

  carregarServicos: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/catalogo/servicos/`);
      if (!res.ok) throw new Error('Falha ao carregar serviços');
      const data = await res.json();
      set({ listaServicos: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  atualizarCampo: (campo: keyof Servico, valor: any) => {
    set((state) => ({
      servicoAtual: { ...state.servicoAtual, [campo]: valor }
    }));
  },

  selecionarServico: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/catalogo/servicos/${id}/`);
      if (!res.ok) throw new Error('Serviço não encontrado');
      const data = await res.json();
      set({ servicoAtual: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  salvarServico: async () => {
    const { servicoAtual, carregarServicos } = get();
    set({ isSaving: true, error: null });

    try {
      if (!servicoAtual.codigo || !servicoAtual.descricao) {
        throw new Error('Preencha os campos obrigatórios (Código e Descrição).');
      }

      const method = servicoAtual.id ? 'PUT' : 'POST';
      const url = servicoAtual.id 
        ? `${API_BASE}/catalogo/servicos/${servicoAtual.id}/` 
        : `${API_BASE}/catalogo/servicos/`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(servicoAtual)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(JSON.stringify(errData));
      }

      await carregarServicos();
      set({ isSaving: false });
      get().resetForm();
      alert('Serviço salvo com sucesso!');
    } catch (err: any) {
      set({ error: err.message, isSaving: false });
    }
  },

  excluirServico: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/catalogo/servicos/${id}/`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Falha ao excluir serviço');
      
      const { carregarServicos } = get();
      await carregarServicos();
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  resetForm: () => {
    set({ servicoAtual: { ...defaultServico }, error: null });
  }
}));
