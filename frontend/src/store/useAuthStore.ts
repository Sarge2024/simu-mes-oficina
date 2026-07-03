import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useMasterStore } from './useMasterStore';

// ── Roles RBAC ──
export type Role = 'MASTER' | 'ADMIN' | 'FINANCEIRO' | 'SUPERVISOR' | 'COLABORADOR';

export interface User {
  id: number;
  username: string;
  nome: string;
  email: string;
  cargo: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tenantId: number | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setTenantId: (id: number | null) => void;
}

// ── Mock Users para desenvolvimento ──
const MOCK_USERS: Record<string, User> = {
  admin:        { id: 0, username: 'admin',        nome: 'Admin Master',     email: 'admin@simumes.com.br',        cargo: 'Diretor de Sistemas',  role: 'MASTER' },
  master:       { id: 0, username: 'master',       nome: 'Admin Master',     email: 'master@simumes.com.br',       cargo: 'Diretor de Sistemas',  role: 'MASTER' },
  financeiro:   { id: 2, username: 'financeiro',   nome: 'Ana Controller',   email: 'financeiro@simumes.com.br',   cargo: 'Gestor Financeiro',    role: 'FINANCEIRO' },
  supervisor:   { id: 3, username: 'supervisor',   nome: 'Carlos Gerente',   email: 'supervisor@simumes.com.br',   cargo: 'Chefe de Oficina',     role: 'SUPERVISOR' },
  colaborador:  { id: 4, username: 'colaborador',  nome: 'João Mecânico',    email: 'colaborador@simumes.com.br',  cargo: 'Mecânico',             role: 'COLABORADOR' },
};

function findMockUser(input: string): User | null {
  const key = input.toLowerCase().trim();
  // Match by username
  if (MOCK_USERS[key]) return MOCK_USERS[key];
  // Match by email
  for (const u of Object.values(MOCK_USERS)) {
    if (u.email === key) return u;
  }
  return null;
}

// ── Hierarquia de acesso: ADMIN > FINANCEIRO > SUPERVISOR > COLABORADOR ──
const ROLE_HIERARCHY: Record<Role, number> = {
  MASTER: 5,
  ADMIN: 4,
  FINANCEIRO: 3,
  SUPERVISOR: 2,
  COLABORADOR: 1,
};

export function hasAccess(userRole: Role, requiredRoles: Role[]): boolean {
  return requiredRoles.some((r) => ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[r]);
}

export function getDefaultRoute(role: Role): string {
  if (role === 'MASTER') return '/admin/master';
  return '/home';
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      tenantId: 1, // Default to tenant 1 for development

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          await new Promise((r) => setTimeout(r, 800));

          // Verificar senhas no masterStore (usuários gerenciados pelo Master)
          const masterUsers = useMasterStore.getState().usuarios;
          const masterUser = masterUsers.find(
            (u) => u.username.toLowerCase() === username.toLowerCase().trim()
          );

          if (masterUser && masterUser.senha === password && masterUser.ativo) {
            const mockUser: User = {
              id: masterUser.id,
              username: masterUser.username,
              nome: masterUser.nome,
              email: masterUser.email,
              cargo: masterUser.cargo,
              role: masterUser.role,
            };
            set({
              user: mockUser,
              token: `dev-token-${mockUser.role.toLowerCase()}`,
              isAuthenticated: true,
              isLoading: false,
              tenantId: mockUser.role === 'MASTER' ? null : 1,
            });
            return;
          }

          // Fallback: mock users legados
          const mockUser = findMockUser(username);
          if (mockUser && password.toLowerCase() === 'admin') {
            set({
              user: mockUser,
              token: `dev-token-${mockUser.role.toLowerCase()}`,
              isAuthenticated: true,
              isLoading: false,
              tenantId: mockUser.role === 'MASTER' ? null : 1,
            });
          } else {
            set({ error: 'Credenciais inválidas.', isLoading: false });
          }
        } catch {
          set({ error: 'Erro de conexão com o servidor.', isLoading: false });
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, error: null, tenantId: null });
      },

      clearError: () => set({ error: null }),
      setTenantId: (id: number | null) => set({ tenantId: id }),
    }),
    { name: 'simumes-auth' }
  )
);
