import { useState, useEffect } from 'react';
import DefaultLayout from '../../layouts/DefaultLayout';
import { useAuthStore } from '../../store/useAuthStore';
import { useUISettingsStore, ACCENT_MAP } from '../../store/useUISettingsStore';
import PageHeader from '../../components/shared/PageHeader';
import Card from '../../components/shared/Card';

export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { accent } = useUISettingsStore();
  const accentColor = ACCENT_MAP[accent]?.primary || '#6366f1';

  const [limiteVariacao, setLimiteVariacao] = useState('15');
  const [simCustoFixo, setSimCustoFixo] = useState('45000');
  const [simMargem, setSimMargem] = useState('35');
  const [simMetas, setSimMetas] = useState('12000');
  const [simDepreciacao, setSimDepreciacao] = useState('3000');
  const [simCapex, setSimCapex] = useState('0');
  const [simNovoCusto, setSimNovoCusto] = useState('0');
  const [peResult, setPeResult] = useState<{ PEO: number; PEE: number; PEF: number } | null>(null);
  const [isLogsPopupOpen, setIsLogsPopupOpen] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  const carregarLogs = async () => {
    try {
      const res = await fetch('/api/django/api/core/logs-auditoria/?page_size=50');
      const data = await res.json();
      setLogs(Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error("Erro ao carregar logs:", err);
    }
  };

  useEffect(() => {
    carregarLogs();
    const interval = setInterval(carregarLogs, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, []);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

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

  return (
    <>
      <DefaultLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <PageHeader 
            title={user?.nome ?? 'Administrador'} 
            subtitle="Visão global, Cockpit da Sociedade e Simulador"
            showBackButton={false}
          />
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
        </div>

        {/* KPIs de Governança */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Stress de Caixa', value: '12%', color: '#10b981', sub: 'RF-GOV-04 • Saudável' },
            { label: 'Conta Sociedade (2.6)', value: 'R$ 18.400', color: accentColor, sub: 'Mês corrente' },
            { label: 'OS Retidas', value: '2', color: '#ef4444', sub: 'Aguardando aprovação' },
            { label: 'Eventos de Auditoria', value: '47', color: '#6366f1', sub: 'Últimos 30 dias' },
          ].map((c) => (
            <Card key={c.label} padding="sm">
              <p className="text-xs text-surface-500 uppercase tracking-wider">{c.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: c.color }}>{c.value}</p>
              <p className="text-[11px] text-surface-600 mt-1">{c.sub}</p>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Configurações Globais & Auditoria */}
          <div className="flex flex-col gap-6">
            <Card padding="md">
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
            </Card>

            <Card padding="lg" className="flex-1">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-surface-100">🛡️ Logs de Auditoria</h2>
                <button 
                  onClick={() => setIsLogsPopupOpen(true)}
                  className="text-xs text-surface-400 hover:text-surface-200"
                >
                  Ver todos
                </button>
              </div>
              <div className="space-y-3">
                {logs.slice(0, 5).map((log, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-surface-800 last:border-0">
                    <span className="text-xs font-mono text-surface-500 mt-0.5">{formatTime(log.timestamp)}</span>
                    <div>
                      <p className="text-sm text-surface-200">{log.acao} {log.tabela} #{log.registro_id}</p>
                      <p className="text-xs text-surface-600">{log.usuario}</p>
                    </div>
                  </div>
                ))}
                {logs.length === 0 && (
                  <p className="text-xs text-surface-500 text-center py-4 italic">Nenhuma atividade registrada.</p>
                )}
              </div>
            </Card>
          </div>

          {/* Simulador What-If */}
          <Card padding="md">
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
                    style={{ focusRing: accentColor } as React.CSSProperties}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={calcularPE}
              className="w-full px-4 py-3 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90 shadow-lg"
              style={{ backgroundColor: accentColor, boxShadow: `0 10px 15px -3px ${accentColor}40` }}
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
          </Card>
        </div>

        {/* Cockpit da Sociedade */}
        <Card padding="md">
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
        </Card>
      </div>
    </DefaultLayout>

    {/* Popup Logs de Auditoria */}
    {isLogsPopupOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-2xl bg-surface-900 border border-surface-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between p-6 border-b border-surface-800">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-primary-500">🛡️</span> Logs de Auditoria Completos
              </h3>
              <p className="text-xs text-surface-400 mt-1">Histórico detalhado de ações críticas no sistema</p>
            </div>
            <button 
              onClick={() => setIsLogsPopupOpen(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-800 text-surface-400 hover:text-white hover:bg-surface-700 transition-all"
            >
              ✕
            </button>
          </div>
          
          <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              {logs.map((log, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-surface-950/50 border border-surface-800/50 hover:border-primary-500/30 transition-all group">
                  <div className="px-2 py-1 rounded bg-surface-800 text-[10px] font-mono text-surface-400 group-hover:text-primary-400 transition-colors">
                    {formatTime(log.timestamp)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-surface-100 group-hover:text-white transition-colors">
                      {log.acao} {log.tabela} (ID: {log.registro_id})
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500/50"></div>
                      <p className="text-xs text-surface-500">{log.usuario}</p>
                    </div>
                    {/* Detalhes expansíveis ou mini-view se necessário */}
                    <div className="mt-2 text-[10px] text-surface-600 font-mono hidden group-hover:block animate-in slide-in-from-top-1">
                      {JSON.stringify(log.detalhes).slice(0, 100)}...
                    </div>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="py-20 text-center">
                  <p className="text-surface-500 italic">O sistema de auditoria está ativo, mas ainda não há logs processados.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-6 bg-surface-950 border-t border-surface-800 flex justify-end">
            <button 
              onClick={() => setIsLogsPopupOpen(false)}
              className="px-6 py-2.5 bg-surface-800 hover:bg-surface-700 text-surface-100 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              Fechar Visualização
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
