import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUISettingsStore, ACCENT_MAP } from '../../store/useUISettingsStore';

interface Tenant {
  id: number;
  razao_social: string;
  cnpj: string;
  ativo: boolean;
}

export default function TenantSwitcher() {
  const { user, tenantId, setTenantId } = useAuthStore();
  const { accent } = useUISettingsStore();
  const accentColor = ACCENT_MAP[accent]?.primary || '#6366f1';
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/django/api/core/empresas/')
      .then((r) => r.json())
      .then((data) => {
        const list: Tenant[] = Array.isArray(data) ? data : (data.results || []);
        setTenants(list.filter((t) => t.ativo));
      })
      .catch(() => {});
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Only show for MASTER users
  if (!user || user.role !== 'MASTER') return null;

  const activeTenant = tenants.find((t) => t.id === tenantId);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all"
        style={{
          borderColor: tenantId ? `${accentColor}60` : '#ef444460',
          backgroundColor: tenantId ? `${accentColor}10` : '#ef444410',
          color: tenantId ? accentColor : '#ef4444',
        }}
      >
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
        </svg>
        <span className="truncate max-w-[180px]">
          {activeTenant ? activeTenant.razao_social : '⚠ Selecione um Tenant'}
        </span>
        <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-surface-900 border border-surface-700 rounded-xl shadow-2xl z-[100] overflow-hidden">
          <div className="px-3 py-2 border-b border-surface-700">
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Selecionar Tenant</p>
          </div>
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {/* Option: No Tenant (global view) */}
            <button
              onClick={() => { setTenantId(null); setIsOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors ${
                tenantId === null ? 'bg-surface-800 text-primary-400' : 'text-surface-300 hover:bg-surface-800'
              }`}
            >
              <span className="w-7 h-7 rounded-lg bg-surface-700 flex items-center justify-center text-xs font-bold text-surface-400">🌐</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">Visão Global (Sem Tenant)</p>
                <p className="text-xs text-surface-500">Acesso administrativo geral</p>
              </div>
              {tenantId === null && (
                <svg className="w-4 h-4 text-primary-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Tenant list */}
            {tenants.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTenantId(t.id); setIsOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors ${
                  tenantId === t.id ? 'bg-surface-800 text-primary-400' : 'text-surface-300 hover:bg-surface-800'
                }`}
              >
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: `${accentColor}80` }}
                >
                  {t.razao_social.charAt(0)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{t.razao_social}</p>
                  <p className="text-xs text-surface-500">{t.cnpj}</p>
                </div>
                {tenantId === t.id && (
                  <svg className="w-4 h-4 text-primary-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
