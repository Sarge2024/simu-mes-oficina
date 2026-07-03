import { create } from 'zustand';
import { djangoApi } from '../lib/api';

export interface LocalizacaoEstoque {
  id?: number;
  local: string;
  sala: string;
  corredor: string;
  lado: string;
  bloco: string;
  prateleira: string;
  codigo?: string;
  capacidade: number | string;
  quantidade: number | string;
  ativo: boolean;
}

interface LocalizacaoStoreState {
  atual: LocalizacaoEstoque;
  lista: LocalizacaoEstoque[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  carregar: () => Promise<void>;
  atualizarCampo: (campo: keyof LocalizacaoEstoque, valor: any) => void;
  selecionar: (id: number) => Promise<void>;
  salvar: () => Promise<void>;
  excluir: (id: number) => Promise<void>;
  resetForm: () => void;
}

const DEFAULT: LocalizacaoEstoque = {
  local: '',
  sala: '',
  corredor: '',
  lado: 'E',
  bloco: '',
  prateleira: '',
  capacidade: 0,
  quantidade: 0,
  ativo: true,
};

export const useLocalizacaoEstoqueStore = create<LocalizacaoStoreState>((set, get) => ({
  atual: { ...DEFAULT },
  lista: [],
  isLoading: false,
  isSaving: false,
  error: null,

  carregar: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await djangoApi.get('/suprimentos/localizacao/');
      const data = res.data;
      set({ lista: data.results || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  atualizarCampo: (campo, valor) => {
    set((state) => ({ atual: { ...state.atual, [campo]: valor } }));
  },

  selecionar: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await djangoApi.get(`/suprimentos/localizacao/${id}/`);
      set({ atual: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  salvar: async () => {
    const { atual, carregar } = get();
    set({ isSaving: true, error: null });
    try {
      if (!atual.local || !atual.sala || !atual.corredor || !atual.bloco || !atual.prateleira) {
        throw new Error('Preencha Local, Sala, Corredor, Bloco e Prateleira.');
      }
      if (atual.id) {
        await djangoApi.put(`/suprimentos/localizacao/${atual.id}/`, atual);
      } else {
        await djangoApi.post('/suprimentos/localizacao/', atual);
      }
      await carregar();
      set({ isSaving: false });
      get().resetForm();
      alert('Localização salva com sucesso!');
    } catch (err: any) {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      set({ error: msg, isSaving: false });
    }
  },

  excluir: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await djangoApi.delete(`/suprimentos/localizacao/${id}/`);
      await get().carregar();
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  resetForm: () => set({ atual: { ...DEFAULT }, error: null }),
}));
