import { useNavigate } from 'react-router-dom';
import DefaultLayout from '../../layouts/DefaultLayout';
import { useUISettingsStore, ACCENT_MAP } from '../../store/useUISettingsStore';
import type { ThemeMode, AccentColor, SidebarStyle, CardStyle } from '../../store/useUISettingsStore';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-surface-900 border border-surface-700 rounded-xl p-6 mb-4">
    <h3 className="text-sm font-semibold text-surface-100 uppercase tracking-wider mb-4">{title}</h3>
    {children}
  </div>
);

const OptionRow = ({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between py-3 border-b border-surface-800 last:border-0">
    <div>
      <p className="text-sm text-surface-200">{label}</p>
      {desc && <p className="text-xs text-surface-600 mt-0.5">{desc}</p>}
    </div>
    <div className="flex items-center gap-2">{children}</div>
  </div>
);

const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <button
    onClick={() => onChange(!value)}
    className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-primary-600' : 'bg-surface-700'}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow ${value ? 'translate-x-5' : ''}`} />
  </button>
);

const Pill = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
      active ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : 'bg-surface-800 text-surface-400 hover:text-surface-200 hover:bg-surface-700'
    }`}
  >
    {label}
  </button>
);

export default function SettingsPage() {
  const navigate = useNavigate();
  const settings = useUISettingsStore();

  return (
    <DefaultLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-surface-50">⚙️ Configurações do Sistema</h1>
          <p className="text-sm text-surface-500 mt-1">Personalize a aparência e os parâmetros da oficina</p>
        </header>

        <Section title="Aparência">
          <OptionRow label="Tema" desc="Modo de cores da interface">
            <div className="flex gap-1.5">
              {(['dark', 'light'] as ThemeMode[]).map((t) => (
                <Pill key={t} label={t === 'dark' ? '🌙 Escuro' : '☀️ Claro'} active={settings.theme === t} onClick={() => settings.update({ theme: t })} />
              ))}
            </div>
          </OptionRow>

          <OptionRow label="Cor de destaque" desc="Cor principal dos indicadores e gráficos">
            <div className="flex gap-2">
              {(Object.keys(ACCENT_MAP) as AccentColor[]).map((c) => (
                <button
                  key={c}
                  onClick={() => settings.update({ accent: c })}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    settings.accent === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: ACCENT_MAP[c].primary }}
                />
              ))}
            </div>
          </OptionRow>

          <OptionRow label="Estilo dos cards" desc="Formato visual dos painéis">
            <div className="flex gap-1.5">
              {([
                { key: 'rounded', label: '◉ Arredondado' },
                { key: 'sharp', label: '▪ Angular' },
                { key: 'glass', label: '◇ Glass' },
              ] as { key: CardStyle; label: string }[]).map((s) => (
                <Pill key={s.key} label={s.label} active={settings.cardStyle === s.key} onClick={() => settings.update({ cardStyle: s.key })} />
              ))}
            </div>
          </OptionRow>
        </Section>

        <Section title="Layout">
          <OptionRow label="Sidebar" desc="Estilo da barra lateral">
            <div className="flex gap-1.5">
              {([
                { key: 'icons', label: '⬡ Ícones' },
                { key: 'expanded', label: '☰ Expandido' },
              ] as { key: SidebarStyle; label: string }[]).map((s) => (
                <Pill key={s.key} label={s.label} active={settings.sidebar === s.key} onClick={() => settings.update({ sidebar: s.key })} />
              ))}
            </div>
          </OptionRow>

          <OptionRow label="Modo compacto" desc="Reduz espaçamentos para maior densidade de dados">
            <Toggle value={settings.compactMode} onChange={(v) => settings.update({ compactMode: v })} />
          </OptionRow>

          <OptionRow label="Mensagem de boas-vindas" desc="Exibir saudação com nome do usuário no header">
            <Toggle value={settings.showWelcome} onChange={(v) => settings.update({ showWelcome: v })} />
          </OptionRow>
        </Section>

        <Section title="Recursos da Oficina">
          <OptionRow label="Equipe e Infraestrutura" desc="Cadastre seus profissionais e gerencie os boxes de manutenção">
            <button 
              onClick={() => navigate('/settings/oficina')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-500 transition-colors flex items-center gap-2"
            >
              🛠️ Configurar Workshop
            </button>
          </OptionRow>

          <OptionRow label="Horário de Abertura" desc="Início do expediente (afeta cronômetros de OS)">
            <input 
              type="time" 
              value={settings.workingHoursStart} 
              onChange={(e) => settings.update({ workingHoursStart: e.target.value })}
              className="bg-surface-800 border border-surface-700 text-surface-200 rounded px-2 py-1 focus:outline-none focus:border-primary-500"
            />
          </OptionRow>

          <OptionRow label="Horário de Fechamento" desc="Fim do expediente (afeta cronômetros de OS)">
            <input 
              type="time" 
              value={settings.workingHoursEnd} 
              onChange={(e) => settings.update({ workingHoursEnd: e.target.value })}
              className="bg-surface-800 border border-surface-700 text-surface-200 rounded px-2 py-1 focus:outline-none focus:border-primary-500"
            />
          </OptionRow>
        </Section>

        {/* Preview Card */}
        <div className="bg-surface-900 border border-surface-700 rounded-xl p-6 mb-4">
          <h3 className="text-sm font-semibold text-surface-100 uppercase tracking-wider mb-4">Pré-visualização</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'KPI Exemplo', value: '45.320', trend: '+8%' },
              { label: 'Eficiência', value: '92%', trend: null },
              { label: 'Pedidos', value: '1.230', trend: '+15%' },
            ].map((c) => (
              <div
                key={c.label}
                className={`p-4 border transition-all ${
                  settings.cardStyle === 'sharp' ? 'rounded-none' : settings.cardStyle === 'glass' ? 'rounded-2xl backdrop-blur-xl bg-white/5' : 'rounded-xl'
                } ${settings.cardStyle !== 'glass' ? 'bg-surface-800' : ''} border-surface-700`}
              >
                <p className="text-xs text-surface-500">{c.label}</p>
                <p className="text-xl font-bold mt-1" style={{ color: ACCENT_MAP[settings.accent].primary }}>{c.value}</p>
                {c.trend && <p className="text-[11px] text-accent-400 mt-0.5">{c.trend} vs semana anterior</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Reset */}
        <div className="flex justify-end">
          <button
            onClick={settings.reset}
            className="px-5 py-2 rounded-xl bg-surface-800 border border-surface-700 text-surface-400 text-sm hover:text-danger-400 hover:border-danger-500/30 transition-colors"
          >
            ↺ Restaurar padrões
          </button>
        </div>
      </div>
    </DefaultLayout>
  );
}
