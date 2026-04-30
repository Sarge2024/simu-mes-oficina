import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BoxAgenda {
  box: string;
  os: string;
  veiculo: string;
  mecanico: string;
  inicio: string;
  fim: string;
  status: 'Disponível' | 'Em Execução' | 'Diagnóstico' | 'Em Manutenção';
  etapas?: { name: string; concluido: boolean; inicio: string | null }[];
}

export interface Profissional {
  id: string;
  nome: string;
  especialidade: 'Supervisor' | 'Mecânico' | 'Eletricista' | 'Meceletri';
  ativo: boolean;
}

interface AgendaStore {
  boxes: BoxAgenda[];
  equipe: Profissional[];
  alocarBox: (boxName: string, osId: string, veiculo: string) => void;
  // Configuração
  adicionarProfissional: (p: Profissional) => void;
  removerProfissional: (id: string) => void;
  adicionarBox: (box: BoxAgenda) => void;
  removerBox: (boxName: string) => void;
  atualizarStatus: (boxName: string, novoStatus: BoxAgenda['status']) => void;
}

const INITIAL_BOXES: BoxAgenda[] = [
  { box: 'Box 01', os: '103', veiculo: 'FIAT UNO - ABC-1234', mecanico: 'Carlos (Motor)', inicio: '08:00', fim: '14:00', status: 'Em Execução' },
  { box: 'Box 02', os: '101', veiculo: 'VW GOL - XYZ-9876', mecanico: 'João (Elétrica)', inicio: '09:00', fim: '10:30', status: 'Diagnóstico' },
  { box: 'Box 03', os: '', veiculo: '', mecanico: '— Livre —', inicio: '', fim: '', status: 'Disponível' },
  { box: 'Rampa 01', os: '', veiculo: '', mecanico: '— Livre —', inicio: '', fim: '', status: 'Disponível' },
];

const INITIAL_EQUIPE: Profissional[] = [
  { id: '1', nome: 'João Silva', especialidade: 'Mecânico', ativo: true },
  { id: '2', nome: 'Carlos Souza', especialidade: 'Eletricista', ativo: true },
];

export const useAgendaStore = create<AgendaStore>()(
  persist(
    (set) => ({
      boxes: INITIAL_BOXES,
      equipe: INITIAL_EQUIPE,
      
      alocarBox: (boxName, osId, veiculo) => set((state) => ({
        boxes: state.boxes.map((b) => 
          b.box === boxName 
            ? { ...b, os: osId, veiculo: veiculo, status: 'Em Manutenção', mecanico: 'A definir' } 
            : b
        )
      })),

      adicionarProfissional: (p) => set((state) => ({ equipe: [...state.equipe, p] })),
      removerProfissional: (id) => set((state) => ({ equipe: state.equipe.filter(p => p.id !== id) })),
      
      adicionarBox: (box) => set((state) => ({ boxes: [...state.boxes, box] })),
      removerBox: (boxName) => set((state) => ({ boxes: state.boxes.filter(b => b.box !== boxName) })),
      
      atualizarStatus: (boxName, novoStatus) => set((state) => ({
        boxes: state.boxes.map((b) => 
          b.box === boxName ? { ...b, status: novoStatus } : b
        )
      })),
    }),
    { name: 'simu-mes-agenda' }
  )
);
