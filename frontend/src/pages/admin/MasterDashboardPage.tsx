import { useEffect } from 'react';
import DefaultLayout from '../../layouts/DefaultLayout';
import { useAuthStore } from '../../store/useAuthStore';
import { useMasterStore } from '../../store/useMasterStore';
import { useUISettingsStore, ACCENT_MAP } from '../../store/useUISettingsStore';
import Card from '../../components/shared/Card';

export default function MasterDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { accent } = useUISettingsStore();
  const accentColor = ACCENT_MAP[accent]?.primary || '#6366f1';
  const { usuarios, parametros, empresas, fetchUsuarios, fetchParametros, fetchEmpresas } = useMasterStore();

  useEffect(() => {
    fetchUsuarios();
    fetchParametros();
    fetchEmpresas();
  }, [fetchUsuarios, fetchParametros, fetchEmpresas]);

  const usuariosAtivos = usuarios.filter((u) => u.ativo).length;
  const empresasAtivas = empresas.length;

  return (
    <DefaultLayout>
      <div className="p-6 h-full flex flex-col">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-surface-50">Painel Master Admin</h1>
            <p className="text-sm text-surface-500 mt-1">
              Bem-vindo, {user?.nome ?? 'Admin Master'} — Gerenciamento central do sistema
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-500/10 border border-primary-500/20">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-primary-400">MASTER</span>
          </div>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Empresas Cadastradas', value: String(empresasAtivas), color: accentColor, icon: '🏢', sub: 'Matrizes e filiais' },
            { label: 'Usuários Ativos', value: String(usuariosAtivos), color: '#10b981', icon: '👥', sub: `de ${usuarios.length} cadastrados` },
            { label: 'Parâmetros Sistema', value: String(parametros.length), color: '#f59e0b', icon: '⚙️', sub: 'Configurações ativas' },
            { label: 'Sistema', value: 'Online', color: '#6366f1', icon: '🛡️', sub: 'v0.1.0 — SIMU_MES' },
          ].map((c) => (
            <Card key={c.label} padding="sm" className="hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: `${c.color}15` }}>
                  {c.icon}
                </div>
                <div>
                  <p className="text-xs text-surface-500 uppercase tracking-wider">{c.label}</p>
                  <p className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
                  <p className="text-[11px] text-surface-600">{c.sub}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Empresas */}
          <Card padding="md" className="flex flex-col" accentBorder>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: `${accentColor}15` }}>🏢</div>
              <h3 className="font-bold text-surface-100">Empresas</h3>
            </div>
            <p className="text-sm text-surface-500 mb-4 flex-1">Cadastro de matrizes, filiais e parceiros do sistema.</p>
            <a
              href="/admin/empresas"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: accentColor }}
            >
              Gerenciar Empresas
            </a>
          </Card>

          {/* Usuários */}
          <Card padding="md" className="flex flex-col border-t-4 border-t-emerald-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg bg-emerald-500/10">👥</div>
              <h3 className="font-bold text-surface-100">Usuários</h3>
            </div>
            <p className="text-sm text-surface-500 mb-4 flex-1">Cadastro e gestão de usuários por empresa e perfil de acesso.</p>
            <a
              href="/admin/usuarios"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold transition-all hover:opacity-90"
            >
              Gerenciar Usuários
            </a>
          </Card>

          {/* Parâmetros */}
          <Card padding="md" className="flex flex-col border-t-4 border-t-amber-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg bg-amber-500/10">⚙️</div>
              <h3 className="font-bold text-surface-100">Parâmetros</h3>
            </div>
            <p className="text-sm text-surface-500 mb-4 flex-1">Parametrização de contas, limites e configurações por tenant.</p>
            <a
              href="/admin/parametros"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-semibold transition-all hover:opacity-90"
            >
              Configurar Parâmetros
            </a>
          </Card>
        </div>

        {/* Resumo Usuários Recentes */}
        <Card padding="md">
          <h2 className="text-lg font-semibold text-surface-100 mb-4">Usuários Recentes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-700 text-left">
                  <th className="pb-3 text-surface-500 font-medium">Usuário</th>
                  <th className="pb-3 text-surface-500 font-medium">Nome</th>
                  <th className="pb-3 text-surface-500 font-medium">Perfil</th>
                  <th className="pb-3 text-surface-500 font-medium">Empresa</th>
                  <th className="pb-3 text-surface-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800">
                {usuarios.slice(0, 6).map((u) => {
                  const empresa = empresas.find((e) => e.id === u.empresa_id);
                  const roleColors: Record<string, string> = {
                    MASTER: '#6366f1',
                    ADMIN: accentColor,
                    FINANCEIRO: '#10b981',
                    SUPERVISOR: '#f59e0b',
                    COLABORADOR: '#64748b',
                  };
                  return (
                    <tr key={u.id} className="hover:bg-surface-800/50 transition-colors">
                      <td className="py-3 font-mono text-xs" style={{ color: accentColor }}>{u.username}</td>
                      <td className="py-3 text-surface-200">{u.nome}</td>
                      <td className="py-3">
                        <span className="px-2 py-1 rounded text-xs font-medium" style={{ color: roleColors[u.role], background: `${roleColors[u.role]}15` }}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 text-surface-400">{empresa?.razao_social ?? '—'}</td>
                      <td className="py-3">
                        {u.ativo
                          ? <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-medium">Ativo</span>
                          : <span className="px-2 py-1 rounded bg-danger-500/20 text-danger-400 text-xs font-medium">Inativo</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DefaultLayout>
  );
}
