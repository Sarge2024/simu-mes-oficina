import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Roles RBAC ──
export type Role = 'ADMIN' | 'FINANCEIRO' | 'SUPERVISOR' | 'COLABORADOR';

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
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// ── Mock Users para desenvolvimento ──
const MOCK_USERS: Record<string, User> = {
  admin:        { id: 1, username: 'admin',        nome: 'Administrador',    email: 'admin@simumes.com.br',        cargo: 'Diretor',              role: 'ADMIN' },
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
  ADMIN: 4,
  FINANCEIRO: 3,
  SUPERVISOR: 2,
  COLABORADOR: 1,
};

export function hasAccess(userRole: Role, requiredRoles: Role[]): boolean {
  return requiredRoles.some((r) => ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[r]);
}

export function getDefaultRoute(role: Role): string {
  switch (role) {
    case 'ADMIN':       return '/admin';
    case 'FINANCEIRO':  return '/financeiro';
    case 'SUPERVISOR':  return '/supervisor';
    case 'COLABORADOR': return '/oficina';
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Substituir por chamada real à API Django (TokenAuth / JWT)
          await new Promise((r) => setTimeout(r, 800));

          const mockUser = findMockUser(username);

          if (mockUser && password.toLowerCase() === 'admin') {
            set({
              user: mockUser,
              token: `dev-token-${mockUser.role.toLowerCase()}`,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({ error: 'Credenciais inválidas.', isLoading: false });
          }
        } catch {
          set({ error: 'Erro de conexão com o servidor.', isLoading: false });
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, error: null });
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'simumes-auth' }
  )
);
