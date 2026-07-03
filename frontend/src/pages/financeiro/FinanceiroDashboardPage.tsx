import { useMemo } from 'react';
import DefaultLayout from '../../layouts/DefaultLayout';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';
import PageHeader from '../../components/shared/PageHeader';
import Card from '../../components/shared/Card';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

ModuleRegistry.registerModules([AllCommunityModule]);

export default function FinanceiroDashboardPage() {
  const formatBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const defaultColDef = useMemo(() => ({ sortable: true, filter: true, resizable: true }), []);

  return (
    <DefaultLayout>
      <div className="flex flex-col h-full">
        <PageHeader 
          title="💰 Painel Financeiro" 
          subtitle="DRE, Pontos de Equilíbrio, Tesouraria e Matriz Orçamentária" 
        />

        {/* Matriz Quadrimestral de Orçamento */}
        <Card padding="md" className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-surface-100">📅 Matriz Quadrimestral de Orçamento (RF-GOV-01)</h2>
            <button className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-500 transition-colors">
              Salvar Metas
            </button>
          </div>
          <div className="ag-theme-alpine-dark w-full" style={{ height: '250px' }}>
            <AgGridReact
              rowData={[
                { conta: '1.1.0.0.0 - Receita Mão de Obra', m1: 85000, m2: 90000, m3: 95000, m4: 100000, total: 370000 },
                { conta: '1.2.0.0.0 - Receita Peças', m1: 120000, m2: 125000, m3: 130000, m4: 135000, total: 510000 },
                { conta: '2.2.0.0.0 - Custos Variáveis (CMV)', m1: -70000, m2: -72000, m3: -75000, m4: -78000, total: -295000 },
                { conta: '2.4.0.0.0 - Custos Fixos (Operação)', m1: -45000, m2: -45000, m3: -45000, m4: -45000, total: -180000 },
                { conta: '2.6.0.0.0 - Metas da Sociedade', m1: -12000, m2: -12000, m3: -15000, m4: -15000, total: -54000 },
              ]}
              columnDefs={[
                { field: 'conta', headerName: 'Conta Contábil', flex: 1, pinned: 'left' },
                { field: 'm1', headerName: 'Mês 1 (Q1)', width: 120, editable: true, valueFormatter: (p) => formatBRL(p.value) },
                { field: 'm2', headerName: 'Mês 2 (Q1)', width: 120, editable: true, valueFormatter: (p) => formatBRL(p.value) },
                { field: 'm3', headerName: 'Mês 3 (Q1)', width: 120, editable: true, valueFormatter: (p) => formatBRL(p.value) },
                { field: 'm4', headerName: 'Mês 4 (Q1)', width: 120, editable: true, valueFormatter: (p) => formatBRL(p.value) },
                { field: 'total', headerName: 'Total Quad.', width: 140, cellStyle: { fontWeight: 'bold' }, valueFormatter: (p) => formatBRL(p.value) },
              ] as ColDef[]}
              defaultColDef={defaultColDef}
            />
          </div>
          <p className="text-[11px] text-surface-500 mt-2">* As metas definidas aqui retroalimentam o Simulador de Cenários e o cálculo do Ponto de Equilíbrio (PEE/PEF).</p>
        </Card>

        {/* PE Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'PEO — Operacional', value: 128571.43, color: 'text-primary-400', desc: 'Custos Fixos / MC%' },
            { label: 'PEE — Econômico', value: 162857.14, color: 'text-accent-400', desc: '(CF + Metas) / MC%' },
            { label: 'PEF — Financeiro', value: 154285.71, color: 'text-warning-400', desc: '(CF + Metas - Deprec.) / MC%' },
          ].map((c) => (
            <Card key={c.label} padding="md" className="hover:border-primary-500/30 transition-colors">
              <p className="text-xs text-surface-500 uppercase tracking-wider">{c.label}</p>
              <p className={`text-2xl font-bold mt-1 ${c.color}`}>{formatBRL(c.value)}</p>
              <p className="text-[11px] text-surface-600 mt-1">{c.desc}</p>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Contas a Pagar/Receber */}
          <Card padding="md">
            <h2 className="text-lg font-semibold text-surface-100 mb-4">📑 Contas a Pagar / Receber</h2>
            <div className="space-y-2">
              {[
                { tipo: 'Receber', desc: 'OS #102 — João Silva', venc: '05/05/2026', valor: 2450, status: 'Aberto', statusColor: 'text-accent-400' },
                { tipo: 'Receber', desc: 'OS #103 — Logística Rapida', venc: '30/04/2026', valor: 8900, status: 'Parcial', statusColor: 'text-warning-400' },
                { tipo: 'Pagar', desc: 'Fornecedor — AutoParts Ltda', venc: '02/05/2026', valor: -3200, status: 'Aberto', statusColor: 'text-danger-400' },
                { tipo: 'Pagar', desc: 'Aluguel — Maio/2026', venc: '10/05/2026', valor: -5500, status: 'Agendado', statusColor: 'text-surface-500' },
              ].map((t, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-surface-800/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-surface-200 truncate">{t.desc}</p>
                    <p className="text-xs text-surface-600">{t.tipo} • Venc: {t.venc}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className={`text-sm font-semibold ${t.valor > 0 ? 'text-accent-400' : 'text-danger-400'}`}>{formatBRL(t.valor)}</p>
                    <p className={`text-xs ${t.statusColor}`}>{t.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Contas Bancárias */}
          <Card padding="md">
            <h2 className="text-lg font-semibold text-surface-100 mb-4">🏦 Contas Bancárias (RF-FIN-02)</h2>
            <div className="space-y-3">
              {[
                { nome: 'Conta Corrente — Banco do Brasil', saldo: 34500, taxa: '0%' },
                { nome: 'Maquininha PagSeguro', saldo: 8200, taxa: '3.49%' },
                { nome: 'Caixa Interno (Espécie)', saldo: 2350, taxa: '0%' },
              ].map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-surface-800/50 border border-surface-700/50">
                  <div>
                    <p className="text-sm text-surface-200">{c.nome}</p>
                    <p className="text-xs text-surface-600">Taxa ADM: {c.taxa}</p>
                  </div>
                  <p className="text-lg font-bold text-accent-400">{formatBRL(c.saldo)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Rendimento de Orçamentação */}
        <Card padding="md">
          <h2 className="text-lg font-semibold text-surface-100 mb-4">📉 Rendimento de Orçamentação — Conta 2.1.5.0.0 (RF-FIN-05)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-700 text-left">
                  <th className="pb-3 text-surface-500 font-medium">Consultor / Mecânico</th>
                  <th className="pb-3 text-surface-500 font-medium text-right">OS Fechadas</th>
                  <th className="pb-3 text-surface-500 font-medium text-right">Perda Spot Price</th>
                  <th className="pb-3 text-surface-500 font-medium text-right">Perda Escopo</th>
                  <th className="pb-3 text-surface-500 font-medium text-right">Total Variação</th>
                  <th className="pb-3 text-surface-500 font-medium text-right">% Precisão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800">
                {[
                  { nome: 'Carlos (Motor)', os: 18, spot: -420, escopo: -180, total: -600, prec: 96.2 },
                  { nome: 'João (Elétrica)', os: 12, spot: -85, escopo: -950, total: -1035, prec: 91.4 },
                  { nome: 'Pedro (Suspensão)', os: 22, spot: -310, escopo: -60, total: -370, prec: 98.1 },
                ].map((r) => (
                  <tr key={r.nome} className="hover:bg-surface-800/50 transition-colors">
                    <td className="py-2.5 text-surface-200">{r.nome}</td>
                    <td className="py-2.5 text-right text-surface-300">{r.os}</td>
                    <td className="py-2.5 text-right text-danger-400">{formatBRL(r.spot)}</td>
                    <td className="py-2.5 text-right text-danger-400">{formatBRL(r.escopo)}</td>
                    <td className="py-2.5 text-right font-semibold text-danger-400">{formatBRL(r.total)}</td>
                    <td className={`py-2.5 text-right font-semibold ${r.prec >= 95 ? 'text-accent-400' : 'text-warning-400'}`}>{r.prec}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DefaultLayout>
  );
}
