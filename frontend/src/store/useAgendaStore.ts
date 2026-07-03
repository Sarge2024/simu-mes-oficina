import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BoxAgenda {
  box: string;
  os: string;
  veiculo: string;
  mecanico: string;
  inicio: string;
  fim: string;
  status: 'Disponível' | 'Em Execução' | 'Diagnóstico' | 'Em Manutenção' | 'Aguardando Início';
  etapas?: { name: string; concluido: boolean; inicio: string | null }[];
}

export interface ItemAprovacao {
  os: number;
  cliente: string;
  veiculo: string;
  variacao: number;
  limite: number;
  valor: number;
  motivo: string;
}

export interface Profissional {
  id: string;
  nome: string;
  especialidade: 'Supervisor' | 'Mecânico' | 'Eletricista' | 'Meceletri';
  ativo: boolean;
  valorHora: number;
}

interface AgendaStore {
  boxes: BoxAgenda[];
  equipe: Profissional[];
  filaAprovacao: ItemAprovacao[];
  alocarBox: (boxName: string, osId: string, veiculo: string) => void;
  // Configuração
  adicionarProfissional: (p: Profissional) => void;
  removerProfissional: (id: string) => void;
  adicionarBox: (box: BoxAgenda) => void;
  removerBox: (boxName: string) => void;
  atualizarStatus: (boxName: string, novoStatus: BoxAgenda['status']) => void;
  removerItemAprovacao: (os: number) => void;
}

const INITIAL_BOXES: BoxAgenda[] = [
  { box: 'Box 01', os: '103', veiculo: 'FIAT UNO - ABC-1234', mecanico: 'Carlos (Motor)', inicio: '08:00', fim: '14:00', status: 'Em Execução' },
  { box: 'Box 02', os: '101', veiculo: 'VW GOL - XYZ-9876', mecanico: 'João (Elétrica)', inicio: '09:00', fim: '10:30', status: 'Diagnóstico' },
  { box: 'Box 03', os: '', veiculo: '', mecanico: '— Livre —', inicio: '', fim: '', status: 'Disponível' },
  { box: 'Rampa 01', os: '', veiculo: '', mecanico: '— Livre —', inicio: '', fim: '', status: 'Disponível' },
];

const INITIAL_EQUIPE: Profissional[] = [
  { id: '1', nome: 'João Silva', especialidade: 'Mecânico', ativo: true, valorHora: 45.00 },
  { id: '2', nome: 'Carlos Souza', especialidade: 'Eletricista', ativo: true, valorHora: 55.00 },
];

const INITIAL_APROVACOES: ItemAprovacao[] = [
  { os: 104, cliente: 'Transportadora Norte', veiculo: 'SCANIA R450 - JKL-5566', variacao: 22, limite: 15, valor: 12500, motivo: 'Cabeçote com trinca não prevista' },
  { os: 107, cliente: 'Maria Souza', veiculo: 'FIAT ARGO - DEF-8899', variacao: 18, limite: 15, valor: 3200, motivo: 'Bomba d\'água + correia (extra pós-desmontagem)' },
];

export const useAgendaStore = create<AgendaStore>()(
  persist(
    (set) => ({
      boxes: INITIAL_BOXES,
      equipe: INITIAL_EQUIPE,
      filaAprovacao: INITIAL_APROVACOES,
      
      alocarBox: (boxName, osId, veiculo) => set((state) => ({
        boxes: state.boxes.map((b) => {
          // Se for o box alvo, aloca a OS
          if (b.box === boxName) {
            return { 
              ...b, 
              os: osId, 
              veiculo: veiculo, 
              status: 'Aguardando Início', 
              mecanico: 'A DEFINIR', 
              inicio: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) 
            };
          }
          // Se a OS já estava em outro box, libera esse box
          if (b.os === osId) {
            return { 
              ...b, 
              os: '', 
              veiculo: '', 
              mecanico: '— Livre —', 
              inicio: '', 
              fim: '', 
              status: 'Disponível' 
            };
          }
          return b;
        })
      })),

      adicionarProfissional: (p) => set((state) => ({ equipe: [...state.equipe, p] })),
      removerProfissional: (id) => set((state) => ({ equipe: state.equipe.filter(p => p.id !== id) })),
      
      adicionarBox: (box) => set((state) => ({ boxes: [...state.boxes, box] })),
      removerBox: (boxName) => set((state) => ({ boxes: state.boxes.filter(b => b.box !== boxName) })),
      
      atualizarStatus: (boxName, novoStatus) => set((state) => ({
        boxes: state.boxes.map((b) => {
          if (b.box === boxName) {
            if (novoStatus === 'Disponível') {
              return { 
                ...b, 
                status: novoStatus, 
                os: '', 
                veiculo: '', 
                mecanico: '— Livre —', 
                inicio: '', 
                fim: '' 
              };
            }
            return { ...b, status: novoStatus };
          }
          return b;
        })
      })),

      removerItemAprovacao: (os) => set((state) => ({
        filaAprovacao: state.filaAprovacao.filter(item => item.os !== os)
      })),
    }),
    { name: 'simu-mes-agenda-v2' }
  )
);
