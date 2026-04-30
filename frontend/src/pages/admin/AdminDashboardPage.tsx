import { useState } from 'react';
import DefaultLayout from '../../layouts/DefaultLayout';
import { useAuthStore } from '../../store/useAuthStore';
import { useUISettingsStore, ACCENT_MAP } from '../../store/useUISettingsStore';

export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { accent, cardStyle, showWelcome } = useUISettingsStore();
  const accentColor = ACCENT_MAP[accent].primary;

  const [limiteVariacao, setLimiteVariacao] = useState('15');
  const [simCustoFixo, setSimCustoFixo] = useState('45000');
  const [simMargem, setSimMargem] = useState('35');
  const [simMetas, setSimMetas] = useState('12000');
  const [simDepreciacao, setSimDepreciacao] = useState('3000');
  const [simCapex, setSimCapex] = useState('0');
  const [simNovoCusto, setSimNovoCusto] = useState('0');
  const [peResult, setPeResult] = useState<{ PEO: number; PEE: number; PEF: number } | null>(null);

  const calcularPE = async () => {
    try {
      const res = await fetch('http://localhost:8001/calculate-pe/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          custo_fixo: parseFloat(simCustoFixo) + parseFloat(simNovoCusto),
          margem_contribuicao_pct: parseFloat(simMargem),
          'metas_sócios': parseFloat(simMetas) + (parseFloat(simCapex) / 12), // Amortizando capex simplificado
          depreciacao: parseFloat(simDepreciacao),
        }),
      });
      const data = await res.json();
      setPeResult(data);
    } catch {
      setPeResult(null);
    }
  };

  const formatBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const cardClass = `border border-surface-700 transition-all hover:border-opacity-60 ${
    cardStyle === 'sharp' ? 'rounded-none' : cardStyle === 'glass' ? 'rounded-2xl backdrop-blur-xl bg-white/[0.03]' : 'rounded-xl bg-surface-900'
  } ${cardStyle !== 'glass' ? 'bg-surface-900' : ''}`;

  return (
    <DefaultLayout>
      <div className="p-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div>
            {showWelcome && <p className="text-sm text-surface-500">Bem-vindo de volta,</p>}
            <h1 className="text-2xl font-bold text-surface-50">{user?.nome ?? 'Administrador'}</h1>
            <p className="text-sm text-surface-500 mt-1">Visão global, Cockpit da Sociedade e Simulador</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input placeholder="Pesquisar logs..." className="w-64 pl-9 pr-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
              <svg className="w-4 h-4 text-surface-600 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <button className="relative p-2.5 rounded-xl bg-surface-800 border border-surface-700 text-surface-400 hover:text-surface-200 transition-colors">
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: accentColor }} />
              <span className="text-lg">🔔</span>
            </button>
          </div>
        </header>

        {/* KPIs de Governança */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Stress de Caixa', value: '12%', color: '#10b981', sub: 'RF-GOV-04 • Saudável' },
            { label: 'Conta Sociedade (2.6)', value: 'R$ 18.400', color: accentColor, sub: 'Mês corrente' },
            { label: 'OS Retidas', value: '2', color: '#ef4444', sub: 'Aguardando aprovação' },
            { label: 'Eventos de Auditoria', value: '47', color: '#6366f1', sub: 'Últimos 30 dias' },
          ].map((c) => (
            <div key={c.label} className={`${cardClass} p-5`}>
              <p className="text-xs text-surface-500 uppercase tracking-wider">{c.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: c.color }}>{c.value}</p>
              <p className="text-[11px] text-surface-600 mt-1">{c.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Configurações Globais & Auditoria */}
          <div className="flex flex-col gap-6">
            <div className={`${cardClass} p-6`}>
              <h2 className="text-lg font-semibold text-surface-100 mb-4">⚙️ Parâmetros Globais</h2>
              <div>
                <label className="block text-sm text-surface-300 mb-1">LIMITE_VARIACAO_OS_PCT (%)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={limiteVariacao}
                    onChange={(e) => setLimiteVariacao(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 text-sm focus:outline-none"
                  />
                  <button className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors" style={{ backgroundColor: accentColor }}>
                    Salvar
                  </button>
                </div>
                <p className="text-[11px] text-surface-600 mt-1">OS com variação acima deste % será retida para aprovação gerencial.</p>
              </div>
            </div>

            <div className={`${cardClass} p-6 flex-1`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-surface-100">🛡️ Logs de Auditoria</h2>
                <button className="text-xs text-surface-400 hover:text-surface-200">Ver todos</button>
              </div>
              <div className="space-y-3">
                {[
                  { time: '10:42', user: 'Pedro Supervisor', action: 'Desbloqueio Gerencial OS #104' },
                  { time: '09:15', user: 'Ana Financeiro', action: 'Renegociação Título #882' },
                  { time: '08:30', user: 'Sistema', action: 'Fechamento DRE consolidado' },
                ].map((log, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-surface-800 last:border-0">
                    <span className="text-xs font-mono text-surface-500 mt-0.5">{log.time}</span>
                    <div>
                      <p className="text-sm text-surface-200">{log.action}</p>
                      <p className="text-xs text-surface-600">{log.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Simulador What-If */}
          <div className={`${cardClass} p-6`}>
            <h2 className="text-lg font-semibold text-surface-100 mb-4">📊 Simulador de Cenários de Investimento (RF-GOV-05)</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: 'Custo Fixo Base (R$)', val: simCustoFixo, set: setSimCustoFixo },
                { label: 'Margem Contribuição (%)', val: simMargem, set: setSimMargem },
                { label: 'Metas Sociedade (R$)', val: simMetas, set: setSimMetas },
                { label: 'Depreciação Atual (R$)', val: simDepreciacao, set: setSimDepreciacao },
                { label: 'Simular Novo CAPEX (R$)', val: simCapex, set: setSimCapex },
                { label: 'Simular Incremento Custo (R$)', val: simNovoCusto, set: setSimNovoCusto },
              ].map((f) => (
                <div key={f.label}>
                  <label className="block text-xs text-surface-400 mb-1.5">{f.label}</label>
                  <input
                    type="number"
                    value={f.val}
                    onChange={(e) => f.set(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 text-sm focus:outline-none"
                    style={{ focusRing: accentColor }}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={calcularPE}
              className="w-full px-4 py-3 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90 shadow-lg"
              style={{ backgroundColor: accentColor, shadowColor: `${accentColor}40` }}
            >
              Projetar Impacto no Ponto de Equilíbrio
            </button>
            {peResult && (
              <div className="mt-6 grid grid-cols-3 gap-3 p-4 rounded-xl bg-surface-800/50 border border-surface-700">
                {[
                  { label: 'PE Operacional', val: peResult.PEO, color: '#6366f1' },
                  { label: 'PE Econômico', val: peResult.PEE, color: accentColor },
                  { label: 'PE Financeiro', val: peResult.PEF, color: '#f97316' },
                ].map((r) => (
                  <div key={r.label} className="text-center">
                    <p className="text-xs text-surface-500 mb-1">{r.label}</p>
                    <p className="text-lg font-bold" style={{ color: r.color }}>{formatBRL(r.val)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cockpit da Sociedade */}
        <div className={`${cardClass} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-100">👥 Cockpit da Sociedade — Isolamento Patrimonial (Conta 2.6.0.0.0)</h2>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-surface-800 text-surface-300 border border-surface-700">RF-GOV-03</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-700 text-left">
                  <th className="pb-3 text-surface-500 font-medium">Conta Contábil</th>
                  <th className="pb-3 text-surface-500 font-medium">Descrição</th>
                  <th className="pb-3 text-surface-500 font-medium text-right">Valor Mês Realizado</th>
                  <th className="pb-3 text-surface-500 font-medium text-right">Acumulado Quadrimestre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800">
                {[
                  { cod: '2.6.1.0.0', desc: 'Pró-labore Sócios', mes: 8000, acum: 32000 },
                  { cod: '2.6.2.1.0', desc: 'Habitação e Moradia (Extração)', mes: 3200, acum: 12800 },
                  { cod: '2.6.2.2.0', desc: 'Saúde e Odontologia (Extração)', mes: 1800, acum: 7200 },
                  { cod: '2.6.2.3.0', desc: 'Educação (Extração)', mes: 2400, acum: 9600 },
                  { cod: '2.6.2.4.0', desc: 'Veículos Particulares (Extração)', mes: 1500, acum: 6000 },
                  { cod: '2.6.2.5.0', desc: 'Cartões de Crédito Pessoais (Extração)', mes: 1500, acum: 6000 },
                  { cod: '2.6.4.0.0', desc: '(-) Aportes de Capital na Sociedade', mes: -5000, acum: -20000 },
                ].map((r) => (
                  <tr key={r.cod} className="hover:bg-surface-800/50 transition-colors">
                    <td className="py-3 font-mono text-xs" style={{ color: accentColor }}>{r.cod}</td>
                    <td className="py-3 text-surface-200">{r.desc}</td>
                    <td className={`py-3 text-right font-medium ${r.mes < 0 ? 'text-[#10b981]' : 'text-surface-100'}`}>{formatBRL(r.mes)}</td>
                    <td className={`py-3 text-right font-medium ${r.acum < 0 ? 'text-[#10b981]' : 'text-surface-100'}`}>{formatBRL(r.acum)}</td>
                  </tr>
                ))}
                <tr className="bg-surface-800/30">
                  <td colSpan={2} className="py-3 text-right font-bold text-surface-200">TOTAL EXTRAÇÃO (BURNDOWN)</td>
                  <td className="py-3 text-right font-bold text-[#ef4444]">{formatBRL(13400)}</td>
                  <td className="py-3 text-right font-bold text-[#ef4444]">{formatBRL(53600)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
