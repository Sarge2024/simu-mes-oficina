import { useState, useMemo } from 'react';
import DefaultLayout from '../../layouts/DefaultLayout';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { useUISettingsStore, ACCENT_MAP } from '../../store/useUISettingsStore';
import { useMasterStore, type TenantParametro } from '../../store/useMasterStore';
import Card from '../../components/shared/Card';

ModuleRegistry.registerModules([AllCommunityModule]);

const TIPO_OPTIONS = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Numérico' },
  { value: 'boolean', label: 'Verdadeiro/Falso' },
  { value: 'json', label: 'JSON' },
  { value: 'select', label: 'Seleção' },
];

export default function ParametroMasterPage() {
  const { accent } = useUISettingsStore();
  const accentColor = ACCENT_MAP[accent]?.primary || '#6366f1';
  const { parametros, empresas, createParametro, updateParametro, deleteParametro } = useMasterStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingParam, setEditingParam] = useState<Partial<TenantParametro> | null>(null);
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>('todas');

  const filteredParametros = useMemo(() => {
    return parametros.filter((p) => {
      if (filtroEmpresa !== 'todas' && p.empresa_id !== Number(filtroEmpresa)) return false;
      return true;
    });
  }, [parametros, filtroEmpresa]);

  const openNew = () => {
    setEditingParam({
      empresa_id: empresas[0]?.id ?? 1,
      empresa_nome: empresas[0]?.razao_social ?? '',
      chave: '',
      valor: '',
      descricao: '',
      tipo: 'text',
    });
    setIsDrawerOpen(true);
  };

  const openEdit = (param: TenantParametro) => {
    setEditingParam({ ...param });
    setIsDrawerOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParam) return;

    const empresa = empresas.find((e) => e.id === editingParam.empresa_id);
    const dataToSave = {
      ...editingParam,
      empresa_nome: empresa?.razao_social ?? '',
    };

    if (editingParam.id && parametros.some((p) => p.id === editingParam.id)) {
      updateParametro(editingParam.id, dataToSave);
    } else {
      const { id: _id, atualizado_em: _upd, ...rest } = dataToSave as TenantParametro;
      createParametro(rest);
    }
    setIsDrawerOpen(false);
    setEditingParam(null);
  };

  const handleDelete = (id: number) => {
    if (!confirm('Deseja realmente excluir este parâmetro?')) return;
    deleteParametro(id);
  };

  const TipoBadge = (props: ICellRendererParams) => {
    const tipo = props.value as string;
    const colors: Record<string, string> = {
      text: '#64748b',
      number: '#3b82f6',
      boolean: '#10b981',
      json: '#f59e0b',
      select: '#8b5cf6',
    };
    return (
      <span className="px-2 py-1 rounded text-xs font-medium" style={{ color: colors[tipo] || '#64748b', background: `${colors[tipo] || '#64748b'}15` }}>
        {TIPO_OPTIONS.find((t) => t.value === tipo)?.label || tipo}
      </span>
    );
  };

  const ValorDisplay = (props: ICellRendererParams) => {
    const param = props.data as TenantParametro;
    if (param.tipo === 'boolean') {
      return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${param.valor === 'true' ? 'bg-green-500/20 text-green-400' : 'bg-danger-500/20 text-danger-400'}`}>
          {param.valor === 'true' ? 'Ativado' : 'Desativado'}
        </span>
      );
    }
    if (param.tipo === 'json') {
      return (
        <span className="text-xs font-mono text-surface-400 truncate block max-w-[200px]" title={param.valor}>
          {param.valor.length > 30 ? param.valor.slice(0, 30) + '...' : param.valor}
        </span>
      );
    }
    return <span className="text-surface-200 font-medium">{param.valor}</span>;
  };

  const ActionButtons = (props: ICellRendererParams) => {
    const p = props.data as TenantParametro;
    return (
      <div className="flex gap-2">
        <button
          onClick={() => openEdit(p)}
          className="px-2 py-1 bg-surface-700 text-surface-200 rounded text-xs hover:bg-surface-600 transition-colors"
        >
          Editar
        </button>
        <button
          onClick={() => handleDelete(p.id)}
          className="px-2 py-1 bg-danger-500/20 text-danger-400 rounded text-xs hover:bg-danger-500/40 transition-colors"
        >
          Excluir
        </button>
      </div>
    );
  };

  const columnDefs = useMemo<ColDef[]>(() => [
    { field: 'chave', headerName: 'Parâmetro', width: 220 },
    { field: 'empresa_nome', headerName: 'Empresa', width: 200 },
    { field: 'valor', headerName: 'Valor Atual', width: 220, cellRenderer: ValorDisplay },
    { field: 'tipo', headerName: 'Tipo', width: 110, cellRenderer: TipoBadge },
    { field: 'descricao', headerName: 'Descrição', flex: 1 },
    { headerName: 'Ações', width: 140, cellRenderer: ActionButtons, sortable: false, filter: false },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  const defaultColDef = useMemo(() => ({ sortable: true, filter: true, resizable: true }), []);

  return (
    <DefaultLayout>
      <div className="p-6 h-full flex flex-col">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-surface-50">⚙️ Parâmetros do Sistema</h1>
            <p className="text-sm text-surface-500 mt-1">Parametrização de contas, limites e configurações por empresa</p>
          </div>
          <button
            onClick={openNew}
            className="px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90 shadow-lg"
            style={{ backgroundColor: accentColor, boxShadow: `0 10px 15px -3px ${accentColor}40` }}
          >
            + Novo Parâmetro
          </button>
        </header>

        {/* Filtros */}
        <div className="flex gap-3 mb-4">
          <select
            value={filtroEmpresa}
            onChange={(e) => setFiltroEmpresa(e.target.value)}
            className="px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-200 text-sm focus:outline-none"
          >
            <option value="todas">Todas as Empresas</option>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>{e.razao_social}</option>
            ))}
          </select>
          <div className="ml-auto flex items-center gap-2 text-xs text-surface-500">
            <span className="font-mono">{filteredParametros.length}</span> parâmetro(s)
          </div>
        </div>

        {/* Resumo Rápido */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {TIPO_OPTIONS.map((tipo) => {
            const count = filteredParametros.filter((p) => p.tipo === tipo.value).length;
            const colors: Record<string, string> = {
              text: '#64748b', number: '#3b82f6', boolean: '#10b981', json: '#f59e0b', select: '#8b5cf6',
            };
            return (
              <div key={tipo.value} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-surface-800/50 border border-surface-700">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[tipo.value] }} />
                <div>
                  <p className="text-xs text-surface-500">{tipo.label}</p>
                  <p className="text-lg font-bold" style={{ color: colors[tipo.value] }}>{count}</p>
                </div>
              </div>
            );
          })}
        </div>

        <Card className="flex-1" padding="md">
          <div className="ag-theme-alpine-dark w-full h-full min-h-[400px]">
            <AgGridReact
              rowData={filteredParametros}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
            />
          </div>
        </Card>

        {/* Drawer de Cadastro/Edição */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
            <Card padding="md" className="w-[500px] h-full border-l shadow-2xl overflow-y-auto flex flex-col border-surface-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-surface-100">
                  {editingParam?.id && parametros.some((p) => p.id === editingParam.id)
                    ? 'Editar Parâmetro'
                    : 'Novo Parâmetro'}
                </h2>
                <button onClick={() => setIsDrawerOpen(false)} className="text-surface-400 hover:text-surface-200">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 flex flex-col gap-4">
                <div>
                  <label className="block text-sm text-surface-400 mb-1">Empresa *</label>
                  <select
                    required
                    value={editingParam?.empresa_id ?? ''}
                    onChange={(e) => {
                      const emp = empresas.find((emp) => emp.id === Number(e.target.value));
                      setEditingParam({ ...editingParam, empresa_id: Number(e.target.value), empresa_nome: emp?.razao_social ?? '' });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none"
                  >
                    {empresas.map((e) => (
                      <option key={e.id} value={e.id}>{e.razao_social}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-surface-400 mb-1">Chave (identificador) *</label>
                    <input
                      required
                      value={editingParam?.chave || ''}
                      onChange={(e) => setEditingParam({ ...editingParam, chave: e.target.value.toUpperCase().replace(/\s/g, '_') })}
                      placeholder="ex: LIMITE_VARIACAO_OS_PCT"
                      className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 font-mono text-sm focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-surface-400 mb-1">Tipo *</label>
                    <select
                      value={editingParam?.tipo || 'text'}
                      onChange={(e) => setEditingParam({ ...editingParam, tipo: e.target.value as TenantParametro['tipo'] })}
                      className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none"
                    >
                      {TIPO_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-surface-400 mb-1">Valor *</label>
                  {editingParam?.tipo === 'boolean' ? (
                    <select
                      value={editingParam?.valor || 'true'}
                      onChange={(e) => setEditingParam({ ...editingParam, valor: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none"
                    >
                      <option value="true">Ativado (true)</option>
                      <option value="false">Desativado (false)</option>
                    </select>
                  ) : editingParam?.tipo === 'select' ? (
                    <div>
                      <input
                        required
                        value={editingParam?.valor || ''}
                        onChange={(e) => setEditingParam({ ...editingParam, valor: e.target.value })}
                        placeholder="Valor selecionado"
                        className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none"
                      />
                      <input
                        value={editingParam?.opcoes?.join(', ') || ''}
                        onChange={(e) => setEditingParam({ ...editingParam, opcoes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                        placeholder="Opções separadas por vírgula"
                        className="w-full px-3 py-2 mt-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 text-sm focus:outline-none"
                      />
                    </div>
                  ) : editingParam?.tipo === 'json' ? (
                    <textarea
                      rows={6}
                      required
                      value={editingParam?.valor || ''}
                      onChange={(e) => setEditingParam({ ...editingParam, valor: e.target.value })}
                      className="w-full font-mono text-xs px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-200 focus:outline-none"
                    />
                  ) : (
                    <input
                      required
                      type={editingParam?.tipo === 'number' ? 'number' : 'text'}
                      value={editingParam?.valor || ''}
                      onChange={(e) => setEditingParam({ ...editingParam, valor: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm text-surface-400 mb-1">Descrição</label>
                  <textarea
                    rows={2}
                    value={editingParam?.descricao || ''}
                    onChange={(e) => setEditingParam({ ...editingParam, descricao: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 focus:outline-none"
                  />
                </div>

                <div className="mt-auto pt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex-1 px-4 py-2 rounded-lg border border-surface-600 text-surface-200 hover:bg-surface-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors"
                    style={{ backgroundColor: accentColor }}
                  >
                    Salvar Parâmetro
                  </button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
}
