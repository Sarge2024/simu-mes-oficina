import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role } from './useAuthStore';

// ── Types ──
export interface MasterUser {
  id: number;
  username: string;
  senha: string;
  nome: string;
  email: string;
  cargo: string;
  role: Role;
  empresa_id: number | null;
  ativo: boolean;
  criado_em: string;
}

export interface TenantParametro {
  id: number;
  empresa_id: number;
  empresa_nome: string;
  chave: string;
  valor: string;
  descricao: string;
  tipo: 'text' | 'number' | 'boolean' | 'json' | 'select';
  opcoes?: string[];
  atualizado_em: string;
}

// ── Mock Data ──
const MOCK_USERS: MasterUser[] = [
  { id: 0, username: 'admin', senha: 'admin', nome: 'Admin Master', email: 'admin@simumes.com.br', cargo: 'Diretor de Sistemas', role: 'MASTER', empresa_id: null, ativo: true, criado_em: '2026-01-01T00:00:00' },
  { id: 1, username: 'admin_oficina', senha: 'admin', nome: 'Carlos Diretor', email: 'carlos@simumes.com.br', cargo: 'Diretor', role: 'ADMIN', empresa_id: 1, ativo: true, criado_em: '2026-01-15T10:00:00' },
  { id: 2, username: 'ana_financeiro', senha: 'admin', nome: 'Ana Controller', email: 'ana@simumes.com.br', cargo: 'Gestor Financeiro', role: 'FINANCEIRO', empresa_id: 1, ativo: true, criado_em: '2026-02-01T09:00:00' },
  { id: 3, username: 'carlos_super', senha: 'admin', nome: 'Carlos Gerente', email: 'carlos.gerente@simumes.com.br', cargo: 'Chefe de Oficina', role: 'SUPERVISOR', empresa_id: 1, ativo: true, criado_em: '2026-02-10T08:00:00' },
  { id: 4, username: 'joao_mec', senha: 'admin', nome: 'João Mecânico', email: 'joao@simumes.com.br', cargo: 'Mecânico', role: 'COLABORADOR', empresa_id: 1, ativo: true, criado_em: '2026-03-01T07:00:00' },
  { id: 5, username: 'admin_filial2', senha: 'admin', nome: 'Maria Filial', email: 'maria@filial2.com.br', cargo: 'Diretora', role: 'ADMIN', empresa_id: 2, ativo: true, criado_em: '2026-03-15T10:00:00' },
  { id: 6, username: 'pedro_mec', senha: 'admin', nome: 'Pedro Eletricista', email: 'pedro@filial2.com.br', cargo: 'Eletricista', role: 'COLABORADOR', empresa_id: 2, ativo: false, criado_em: '2026-04-01T07:00:00' },
];

const MOCK_EMPRESAS = [
  { id: 1, razao_social: 'Sagacitas Oficina Matriz' },
  { id: 2, razao_social: 'Sagacitas Filial 2' },
];

const MOCK_PARAMETROS: TenantParametro[] = [
  { id: 1, empresa_id: 1, empresa_nome: 'Sagacitas Oficina Matriz', chave: 'LIMITE_VARIACAO_OS_PCT', valor: '15', descricao: 'Percentual máximo de variação em OS antes de retenção gerencial', tipo: 'number', atualizado_em: '2026-06-01T10:00:00' },
  { id: 2, empresa_id: 1, empresa_nome: 'Sagacitas Oficina Matriz', chave: 'PRAZO_PADRAO_FATURAMENTO', valor: '30', descricao: 'Prazo padrão de faturamento em dias', tipo: 'number', atualizado_em: '2026-06-01T10:00:00' },
  { id: 3, empresa_id: 1, empresa_nome: 'Sagacitas Oficina Matriz', chave: 'MARGEM_MINIMA_SERVICO', valor: '25', descricao: 'Margem mínima de contribuição para serviços (%)', tipo: 'number', atualizado_em: '2026-05-15T14:00:00' },
  { id: 4, empresa_id: 1, empresa_nome: 'Sagacitas Oficina Matriz', chave: 'NOTIFICACAO_EMAIL', valor: 'true', descricao: 'Enviar notificações por e-mail para eventos críticos', tipo: 'boolean', atualizado_em: '2026-04-10T09:00:00' },
  { id: 5, empresa_id: 1, empresa_nome: 'Sagacitas Oficina Matriz', chave: 'IDIOMA_SISTEMA', valor: 'pt-BR', descricao: 'Idioma padrão da interface do sistema', tipo: 'select', opcoes: ['pt-BR', 'en-US', 'es-AR'], atualizado_em: '2026-01-01T00:00:00' },
  { id: 6, empresa_id: 1, empresa_nome: 'Sagacitas Oficina Matriz', chave: 'CONFIGURACAO_THEME', valor: '{"theme":"dark","accent":"indigo"}', descricao: 'Configurações visuais padrão da empresa', tipo: 'json', atualizado_em: '2026-03-01T12:00:00' },
  { id: 7, empresa_id: 2, empresa_nome: 'Sagacitas Filial 2', chave: 'LIMITE_VARIACAO_OS_PCT', valor: '20', descricao: 'Percentual máximo de variação em OS antes de retenção gerencial', tipo: 'number', atualizado_em: '2026-06-01T10:00:00' },
  { id: 8, empresa_id: 2, empresa_nome: 'Sagacitas Filial 2', chave: 'MARGEM_MINIMA_SERVICO', valor: '30', descricao: 'Margem mínima de contribuição para serviços (%)', tipo: 'number', atualizado_em: '2026-05-20T11:00:00' },
];

// ── Store ──
interface MasterState {
  usuarios: MasterUser[];
  parametros: TenantParametro[];
  empresas: { id: number; razao_social: string }[];
  isLoading: boolean;

  // Usuarios
  fetchUsuarios: () => void;
  createUsuario: (user: Omit<MasterUser, 'id' | 'criado_em'>) => void;
  updateUsuario: (id: number, data: Partial<MasterUser>) => void;
  deleteUsuario: (id: number) => void;

  // Parametros
  fetchParametros: () => void;
  createParametro: (param: Omit<TenantParametro, 'id' | 'atualizado_em'>) => void;
  updateParametro: (id: number, data: Partial<TenantParametro>) => void;
  deleteParametro: (id: number) => void;

  // Empresas (for dropdowns)
  fetchEmpresas: () => void;
}

export const useMasterStore = create<MasterState>()(
  persist(
    (set, get) => ({
      usuarios: MOCK_USERS,
      parametros: MOCK_PARAMETROS,
      empresas: MOCK_EMPRESAS,
      isLoading: false,

      fetchUsuarios: () => {
        set({ isLoading: true });
        // In production: djangoApi.get('/core/usuarios/')
        setTimeout(() => set({ usuarios: get().usuarios, isLoading: false }), 300);
      },

      createUsuario: (userData) => {
        const newId = Math.max(...get().usuarios.map((u) => u.id), 0) + 1;
        const newUser: MasterUser = {
          ...userData,
          id: newId,
          criado_em: new Date().toISOString(),
        };
        set({ usuarios: [...get().usuarios, newUser] });
      },

      updateUsuario: (id, data) => {
        set({
          usuarios: get().usuarios.map((u) => (u.id === id ? { ...u, ...data } : u)),
        });
      },

      deleteUsuario: (id) => {
        set({ usuarios: get().usuarios.filter((u) => u.id !== id) });
      },

      fetchParametros: () => {
        set({ isLoading: true });
        setTimeout(() => set({ parametros: get().parametros, isLoading: false }), 300);
      },

      createParametro: (paramData) => {
        const newId = Math.max(...get().parametros.map((p) => p.id), 0) + 1;
        const newParam: TenantParametro = {
          ...paramData,
          id: newId,
          atualizado_em: new Date().toISOString(),
        };
        set({ parametros: [...get().parametros, newParam] });
      },

      updateParametro: (id, data) => {
        set({
          parametros: get().parametros.map((p) =>
            p.id === id ? { ...p, ...data, atualizado_em: new Date().toISOString() } : p
          ),
        });
      },

      deleteParametro: (id) => {
        set({ parametros: get().parametros.filter((p) => p.id !== id) });
      },

      fetchEmpresas: () => {
        set({ empresas: MOCK_EMPRESAS });
      },
    }),
    { name: 'simumes-master' }
  )
);
