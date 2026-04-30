import type { ReactNode } from 'react';

interface AgentModelerLayoutProps {
  children: ReactNode;
}

/**
 * Layout isolado para o Agent Modeler (GDI §2 — Divisão de UI).
 * Fisicamente e visualmente separado do layout padrão da Oficina.
 */
export default function AgentModelerLayout({ children }: AgentModelerLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-950">
      {/* Sidebar dedicada */}
      <aside className="w-56 flex-shrink-0 bg-gradient-to-b from-surface-900 to-surface-950 border-r border-accent-500/20 flex flex-col">
        <div className="h-16 flex items-center px-5 border-b border-accent-500/20">
          <h1 className="text-base font-bold text-accent-400 tracking-wide">
            🤖 Agent Modeler
          </h1>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <a href="/agent-modeler" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-surface-200 hover:bg-accent-500/10 hover:text-accent-400 transition-colors">
            📊 Dashboard
          </a>
          <a href="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-surface-700 hover:bg-surface-800 hover:text-surface-200 transition-colors mt-6">
            ← Voltar para Oficina
          </a>
        </nav>
      </aside>

      {/* Agent Modeler content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
