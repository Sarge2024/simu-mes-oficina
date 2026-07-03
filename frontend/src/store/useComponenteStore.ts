import { create } from 'zustand';

// --- Types ---
export interface Componente {
  id?: number;
  codigo_interno: string;
  tipo_componente: string;
  descricao_generica: string;
  medidas_tecnicas: string;
  unidade: string;
  custo_medio_ponderado: number | string;
  preco_venda: number | string;
  ponto_pedido: number | string;
  estoque_atual: number | string;
  flag_jit: boolean;
  ativo: boolean;
  similares?: {
    id: number;
    codigo_interno: string;
    descricao_generica: string;
    estoque_atual: number;
    preco_venda: number;
  }[];
  veiculos_compativeis?: {
    id: number;
    versao_nome: string;
    modelo_nome: string;
    marca_nome: string;
    observacoes: string;
  }[];
}

interface ComponenteStoreState {
  componenteAtual: Componente;
  listaComponentes: Componente[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  carregarComponentes: () => Promise<void>;
  atualizarCampo: (campo: keyof Componente, valor: any) => void;
  selecionarComponente: (id: number) => Promise<void>;
  salvarComponente: () => Promise<void>;
  excluirComponente: (id: number) => Promise<void>;
  resetForm: () => void;
}

const defaultComponente: Componente = {
  codigo_interno: '',
  tipo_componente: 'OUTRO',
  descricao_generica: '',
  medidas_tecnicas: '',
  unidade: 'UN',
  custo_medio_ponderado: 0,
  preco_venda: 0,
  ponto_pedido: 0,
  estoque_atual: 0,
  flag_jit: false,
  ativo: true
};

const API_BASE = '/api/django/api';

export const useComponenteStore = create<ComponenteStoreState>((set, get) => ({
  componenteAtual: { ...defaultComponente },
  listaComponentes: [],
  isLoading: false,
  isSaving: false,
  error: null,

  carregarComponentes: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/catalogo/componentes/`);
      if (!res.ok) throw new Error('Falha ao carregar componentes');
      const data = await res.json();
      const componentes = Array.isArray(data) ? data : (data.results || []);
      set({ listaComponentes: componentes, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  atualizarCampo: (campo: keyof Componente, valor: any) => {
    set((state) => ({
      componenteAtual: { ...state.componenteAtual, [campo]: valor }
    }));
  },

  selecionarComponente: async (id: number) => {
    if (!id) return;
    set({ isLoading: true, error: null, componenteAtual: defaultComponente });
    try {
      const res = await fetch(`${API_BASE}/catalogo/componentes/${id}/`);
      if (!res.ok) throw new Error('Componente não encontrado');
      const data = await res.json();

      // Fetch veículos compatíveis
      const vRes = await fetch(`${API_BASE}/catalogo/aplicacoes_veiculos/?componente=${id}`);
      if (vRes.ok) {
        const vData = await vRes.json();
        data.veiculos_compativeis = Array.isArray(vData) ? vData : (vData.results || []);
      } else {
        data.veiculos_compativeis = [];
      }

      // Fetch referências (Equivalências Disponíveis) para a Tabela 3
      const refRes = await fetch(`${API_BASE}/catalogo/referencias/?componente=${id}`);
      if (refRes.ok) {
        const refData = await refRes.json();
        data.similares = Array.isArray(refData) ? refData : (refData.results || []);
      } else {
        data.similares = [];
      }

      set({ componenteAtual: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  salvarComponente: async () => {
    const { componenteAtual, carregarComponentes } = get();
    set({ isSaving: true, error: null });

    try {
      if (!componenteAtual.descricao_generica) {
        throw new Error('Preencha os campos obrigatórios (Descrição).');
      }

      // Limpa dados auxiliares para não enviar lixo à API
      const { similares, veiculos_compativeis, ...payload } = componenteAtual;

      const method = componenteAtual.id ? 'PUT' : 'POST';
      const url = componenteAtual.id 
        ? `${API_BASE}/catalogo/componentes/${componenteAtual.id}/` 
        : `${API_BASE}/catalogo/componentes/`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        console.error('Erro na API:', errData);
        throw new Error(typeof errData === 'object' ? JSON.stringify(errData) : 'Erro ao salvar');
      }

      await carregarComponentes();
      set({ isSaving: false });
      get().resetForm();
      alert('Componente salvo com sucesso!');
    } catch (err: any) {
      set({ error: err.message, isSaving: false });
    }
  },

  excluirComponente: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/catalogo/componentes/${id}/`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Falha ao excluir componente');
      
      const { carregarComponentes } = get();
      await carregarComponentes();
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  resetForm: () => {
    set({ componenteAtual: { ...defaultComponente }, error: null });
  }
}));
