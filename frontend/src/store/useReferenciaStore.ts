import { create } from 'zustand';

export interface Referencia {
  id?: number;
  componente: number;
  marca: number;
  marca_nome?: string;
  codigo_fabricante: string;
  material_construcao: string;
}

interface Marca {
  id: number;
  nome_marca: string;
}

interface ReferenciaStore {
  referencias: Referencia[];
  marcas: Marca[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  carregarReferencias: (componenteId: number) => Promise<void>;
  carregarMarcas: () => Promise<void>;
  salvarReferencia: (referencia: Referencia) => Promise<void>;
  excluirReferencia: (id: number) => Promise<void>;
}

const API_BASE = '/api/django/api';

export const useReferenciaStore = create<ReferenciaStore>((set) => ({
  referencias: [],
  marcas: [],
  isLoading: false,
  isSaving: false,
  error: null,

  carregarReferencias: async (componenteId: number) => {
    set({ isLoading: true, error: null });
    try {
      // Usamos o endpoint de referências e filtramos via JS (ou query param se suportado)
      const res = await fetch(`${API_BASE}/catalogo/referencias/`);
      if (!res.ok) throw new Error('Falha ao carregar referências');
      const data: Referencia[] = await res.json();
      const filtradas = data.filter(r => r.componente === componenteId);
      set({ referencias: filtradas, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  carregarMarcas: async () => {
    try {
      const res = await fetch(`${API_BASE}/veiculos/marcas/`);
      if (!res.ok) throw new Error('Falha ao carregar marcas');
      const data = await res.json();
      set({ marcas: data });
    } catch (err: any) {
      console.error(err);
    }
  },

  salvarReferencia: async (referencia: Referencia) => {
    set({ isSaving: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/catalogo/referencias/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(referencia)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(JSON.stringify(errData));
      }
      // Recarrega as referências do componente
      const updatedRes = await fetch(`${API_BASE}/catalogo/referencias/`);
      const allRefs: Referencia[] = await updatedRes.json();
      const updatedRefs = allRefs.filter(r => r.componente === referencia.componente);
      set({ referencias: updatedRefs, isSaving: false });
    } catch (err: any) {
      set({ error: err.message, isSaving: false });
    }
  },

  excluirReferencia: async (id: number) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE}/catalogo/referencias/${id}/`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Falha ao excluir');
      set((s) => ({ referencias: s.referencias.filter(r => r.id !== id), isLoading: false }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  }
}));
