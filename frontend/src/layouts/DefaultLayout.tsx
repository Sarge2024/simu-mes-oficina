import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, hasAccess } from '../store/useAuthStore';
import { useUISettingsStore, ACCENT_MAP } from '../store/useUISettingsStore';
import type { Role } from '../store/useAuthStore';

interface DefaultLayoutProps {
  children: ReactNode;
}

interface NavItem {
  label: string;
  icon: string;
  href?: string;
  roles: Role[];
  subItems?: { label: string; href: string; roles: Role[] }[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', icon: '🏠', href: '/home', roles: ['COLABORADOR', 'SUPERVISOR', 'FINANCEIRO', 'ADMIN'] },
  {
    label: 'Administrativo',
    icon: '🛡️',
    roles: ['ADMIN'],
    subItems: [
      { label: 'Painel Admin', href: '/admin', roles: ['ADMIN'] },
      { label: 'Cadastro Empresas', href: '/admin/empresas', roles: ['ADMIN'] },
      { label: 'Cadastro Clientes', href: '/admin/clientes', roles: ['ADMIN'] },
      { label: 'Cadastro Veículo/Propr', href: '/admin/veiculos', roles: ['ADMIN', 'FINANCEIRO', 'SUPERVISOR', 'COLABORADOR'] },
      { label: 'Cadastro Estoque', href: '/admin/componentes', roles: ['ADMIN', 'FINANCEIRO', 'SUPERVISOR'] },
      { label: 'Cadastro Serviços', href: '/admin/servicos', roles: ['ADMIN', 'SUPERVISOR'] },
    ]
  },
  {
    label: 'Financeiro',
    icon: '💰',
    roles: ['FINANCEIRO', 'ADMIN'],
    subItems: [
      { label: 'Painel Geral', href: '/financeiro', roles: ['FINANCEIRO', 'ADMIN'] },
      { label: 'Plano de Contas', href: '/financeiro/plano-contas', roles: ['FINANCEIRO', 'ADMIN'] },
    ]
  },
  { label: 'Supervisor', icon: '📋', href: '/supervisor', roles: ['SUPERVISOR'] },
  { label: 'Oficina', icon: '🔧', href: '/oficina', roles: ['COLABORADOR'] },
  {
    label: 'Engenharia & AI',
    icon: '⚙️',
    roles: ['ADMIN'],
    subItems: [
      { label: 'Process Simulator', href: '/process-simulator', roles: ['ADMIN'] },
      { label: 'Agent Modeler', href: '/agent-modeler', roles: ['ADMIN'] },
      { label: 'Controle de Revisões', href: '/admin/revisoes', roles: ['ADMIN'] },
    ]
  },
  {
    label: 'Configurações',
    icon: '🛠️',
    roles: ['COLABORADOR'],
    subItems: [
      { label: 'Config. Interface', href: '/settings', roles: ['COLABORADOR'] },
      { label: 'Seleção de Marcas', href: '/settings/marcas', roles: ['COLABORADOR'] },
      { label: 'Gestão de Catálogo', href: '/admin/catalogo', roles: ['ADMIN'] },
      { label: 'Config. Expediente', href: '/settings/expediente', roles: ['ADMIN'] },
      { label: 'Config. Oficina', href: '/settings/oficina', roles: ['ADMIN'] },
    ]
  },
];

export default function DefaultLayout({ children }: DefaultLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const settings = useUISettingsStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const accent = ACCENT_MAP[settings.accent];
    if (accent) {
      root.style.setProperty('--color-primary-300', accent.box);
      root.style.setProperty('--color-primary-400', accent.primary);
      root.style.setProperty('--color-primary-500', accent.primary);
      root.style.setProperty('--color-primary-600', accent.primary);
      root.style.setProperty('--color-accent-400', accent.secondary);
      root.style.setProperty('--color-accent-500', accent.secondary);
    }

    if (settings.theme === 'light') {
      root.style.setProperty('--color-surface-950', '#f8fafc');
      root.style.setProperty('--color-surface-900', '#ffffff');
      root.style.setProperty('--color-surface-800', '#f1f5f9');
      root.style.setProperty('--color-surface-700', '#e2e8f0');
      root.style.setProperty('--color-surface-500', '#64748b');
      root.style.setProperty('--color-surface-400', '#475569');
      root.style.setProperty('--color-surface-200', '#1e293b');
      root.style.setProperty('--color-surface-100', '#0f172a');
      root.style.setProperty('--color-surface-50', '#020617');
    } else {
      root.style.removeProperty('--color-surface-950');
      root.style.removeProperty('--color-surface-900');
      root.style.removeProperty('--color-surface-800');
      root.style.removeProperty('--color-surface-700');
      root.style.removeProperty('--color-surface-500');
      root.style.removeProperty('--color-surface-400');
      root.style.removeProperty('--color-surface-200');
      root.style.removeProperty('--color-surface-100');
      root.style.removeProperty('--color-surface-50');
    }
  }, [settings.accent, settings.theme]);

  const sidebarWidth = settings.sidebar === 'expanded' ? 'w-64' : 'w-20';
  const showLabels = settings.sidebar === 'expanded';

  const visibleItems = NAV_ITEMS.filter(
    (item) => user && hasAccess(user.role, item.roles)
  );

  return (
    <div className={`flex h-screen overflow-hidden bg-surface-950 ${settings.animationsEnabled ? 'transition-all duration-300' : ''}`}>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        ${sidebarWidth} flex-shrink-0 bg-surface-900 border-r border-surface-700 flex flex-col transition-all duration-300
        fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Toggle Button (Desktop) */}
        <button
          onClick={() => settings.update({ sidebar: settings.sidebar === 'expanded' ? 'icons' : 'expanded' })}
          className="hidden lg:flex absolute -right-3 top-6 bg-surface-800 border border-surface-700 w-6 h-6 rounded-full items-center justify-center text-surface-400 hover:text-white hover:bg-surface-700 transition-colors z-50 shadow-md"
        >
          <svg className={`w-3 h-3 transform transition-transform duration-300 ${settings.sidebar === 'expanded' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div className={`${settings.compactMode ? 'h-12' : 'h-16'} flex items-center justify-between px-4 border-b border-surface-700`}>
          <h1 className={`${settings.compactMode ? 'text-base' : 'text-lg'} font-bold text-primary-400 tracking-wide truncate`}>
            {showLabels ? (
              <>SIMU<span className="text-surface-200">_</span>MES <span className="text-surface-400 font-normal">Oficina</span></>
            ) : (
              'SM'
            )}
          </h1>
          <button className="lg:hidden p-2 text-surface-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
            ✕
          </button>
        </div>

        <nav className={`flex-1 py-4 px-3 ${settings.compactMode ? 'space-y-0.5' : 'space-y-1'} overflow-y-auto overflow-x-hidden`}>
          {visibleItems.map((item) => (
            <div key={item.label} className="group relative">
              {item.href ? (
                <a
                  href={item.href}
                  className={`flex items-center gap-3 ${settings.compactMode ? 'py-1.5' : 'py-2.5'} rounded-lg text-sm text-surface-200 hover:bg-surface-800 hover:text-primary-400 transition-colors ${showLabels ? 'px-3' : 'justify-center px-0'}`}
                  title={!showLabels ? item.label : undefined}
                >
                  <span className="text-base">{item.icon}</span>
                  {showLabels && item.label}
                </a>
              ) : (
                <div className="space-y-1">
                  <div className={`flex items-center gap-3 py-2 text-xs font-semibold text-surface-500 uppercase tracking-wider ${settings.compactMode ? 'mt-2 mb-0.5' : 'mt-4 mb-1'} first:mt-0 ${showLabels ? 'px-3' : 'justify-center px-0'}`} title={!showLabels ? item.label : undefined}>
                    <span className="text-base">{item.icon}</span>
                    {showLabels && item.label}
                  </div>
                  <div className={settings.compactMode ? 'space-y-0.5' : 'space-y-1'}>
                    {item.subItems
                      ?.filter((sub) => user && hasAccess(user.role, sub.roles))
                      .map((sub) => (
                        <a
                          key={sub.href}
                          href={sub.href}
                          className={`flex items-center gap-3 ${settings.compactMode ? 'py-1.5' : 'py-2'} rounded-lg text-sm text-surface-400 hover:bg-surface-800 hover:text-primary-400 transition-colors ${showLabels ? 'pl-10 pr-3' : 'justify-center px-0 text-xs'}`}
                          title={!showLabels ? sub.label : undefined}
                        >
                          {showLabels ? sub.label : sub.label.charAt(0)}
                        </a>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User info + Logout */}
        {user && (
          <div className="p-4 border-t border-surface-700">
            {settings.showWelcome && showLabels && (
              <p className="text-xs text-primary-400 mb-2 font-medium">Bem-vindo de volta!</p>
            )}
            <div className={`flex items-center gap-3 mb-3 ${!showLabels ? 'justify-center' : ''}`}>
              <div className="w-8 h-8 rounded-lg bg-primary-600/20 flex-shrink-0 flex items-center justify-center text-primary-400 text-sm font-bold">
                {user.nome.charAt(0)}
              </div>
              {showLabels && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-100 truncate">{user.nome}</p>
                  <p className="text-xs text-surface-500 truncate">{user.cargo}</p>
                </div>
              )}
            </div>
            <button
              onClick={logout}
              className={`w-full flex items-center gap-2 py-2 rounded-lg text-xs text-surface-500 hover:text-danger-400 hover:bg-surface-800 transition-colors ${showLabels ? 'px-3' : 'justify-center px-0'}`}
              title={!showLabels ? "Sair do sistema" : undefined}
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
              {showLabels && 'Sair'}
            </button>
            {showLabels && <p className="text-[10px] text-surface-700 mt-2 text-center">v0.1.0 — {user.role}</p>}
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Top Header */}
        <header className={`${settings.compactMode ? 'h-12' : 'h-16'} flex-shrink-0 lg:hidden flex items-center justify-between px-4 bg-surface-900 border-b border-surface-700`}>
          <button className="p-2 text-surface-400 hover:text-white" onClick={() => setMobileMenuOpen(true)}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 className={`${settings.compactMode ? 'text-xs' : 'text-sm'} font-bold text-primary-400 tracking-widest uppercase`}>SIMU_MES <span className="text-surface-400 font-normal">Oficina</span></h2>
          <div className={`${settings.compactMode ? 'w-8 h-8' : 'w-10 h-10'} rounded-lg bg-primary-600/10 flex items-center justify-center text-primary-400 text-xs font-bold`}>
            {user?.nome.charAt(0)}
          </div>
        </header>

        <main className={`flex-1 overflow-y-auto ${settings.compactMode ? 'p-3 sm:p-4' : 'p-4 sm:p-6 lg:p-8'} custom-scrollbar`}>
          {location.pathname !== '/home' && location.pathname !== '/' && (
            <div className="mb-4 shrink-0 flex">
              <button 
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-900 border border-surface-700 rounded-lg text-surface-400 hover:text-primary-400 hover:border-primary-500/50 hover:bg-surface-800 transition-all text-sm font-medium"
                title="Voltar para a página anterior"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Voltar
              </button>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
