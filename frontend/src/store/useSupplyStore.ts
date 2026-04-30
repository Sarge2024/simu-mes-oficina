import { create } from 'zustand';

export interface SupplyItem {
  id: string;
  os_id: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  status: 'pendente' | 'solicitado' | 'recebido';
  origem: 'diagnostico' | 'aditivo_v1_1';
}

interface SupplyState {
  items: SupplyItem[];
  isLoading: boolean;

  // Actions
  addItems: (newItems: SupplyItem[]) => void;
  updateItemStatus: (id: string, status: SupplyItem['status']) => void;
  clearByOS: (osId: string) => void;

  // Reactive triggers aligned with GDI requirements
  onOSStatusChange: (osId: string, newStatus: string) => void;
  onAditivoApproved: (osId: string, newItems: SupplyItem[]) => void;
}

export const useSupplyStore = create<SupplyState>((set) => ({
  items: [],
  isLoading: false,

  addItems: (newItems) =>
    set((state) => ({
      items: [...state.items, ...newItems],
    })),

  updateItemStatus: (id, status) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, status } : item
      ),
    })),

  clearByOS: (osId) =>
    set((state) => ({
      items: state.items.filter((item) => item.os_id !== osId),
    })),

  /**
   * Reatividade de Suprimentos (GDI §2):
   * Quando a OS mudar de "Diagnóstico" para "Em Execução",
   * o store deve refletir automaticamente os novos itens.
   */
  onOSStatusChange: (osId, newStatus) => {
    if (newStatus === 'em_execucao') {
      // TODO: Chamar a API Django para buscar itens de suprimento da OS
      console.log(`[SupplyStore] OS ${osId} → Em Execução. Fetching supplies...`);
    }
  },

  /**
   * Reatividade de Suprimentos (GDI §2):
   * Quando um Aditivo V1.1 for aprovado,
   * os novos itens devem ser adicionados ao store.
   */
  onAditivoApproved: (osId, newItems) => {
    set((state) => ({
      items: [
        ...state.items,
        ...newItems.map((item) => ({ ...item, os_id: osId, origem: 'aditivo_v1_1' as const })),
      ],
    }));
  },
}));
