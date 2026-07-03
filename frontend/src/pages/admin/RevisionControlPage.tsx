import { useState, useEffect, useCallback } from 'react';
import DefaultLayout from '../../layouts/DefaultLayout';
import { useUISettingsStore, ACCENT_MAP } from '../../store/useUISettingsStore';
import PageHeader from '../../components/shared/PageHeader';
import Card from '../../components/shared/Card';

interface AuditLog {
  id: number;
  usuario: string;
  tabela: string;
  registro_id: string;
  acao: string;
  detalhes: Record<string, unknown>;
  detalhamento: string;
  timestamp: string;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AuditLog[];
}

export default function RevisionControlPage() {
  const { accent } = useUISettingsStore();
  const accentColor = ACCENT_MAP[accent]?.primary || '#6366f1';
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [rollbackStatus, setRollbackStatus] = useState<{message: string, isError: boolean} | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const getCsrfToken = () => {
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : '';
  };

  const fetchLogs = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/django/api/core/logs-auditoria/?page=${pageNum}&page_size=${pageSize}`);
      const data: PaginatedResponse = await res.json();
      setLogs(data.results);
      setTotalCount(data.count);
      setPage(pageNum);
    } catch (err) {
      console.error("Erro ao carregar revisões:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleRollback = async (logId: number) => {
    if (!confirm("Tem certeza que deseja realizar o rollback para esta revisão? Isso alterará o estado atual do registro no banco de dados.")) return;
    
    setRollbackStatus(null);
    try {
      const res = await fetch(`/api/django/api/core/logs-auditoria/${logId}/rollback/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
      });
      const data = await res.json();
      
      if (res.ok) {
        setRollbackStatus({message: "Rollback concluído com sucesso!", isError: false});
        fetchLogs(page);
      } else {
        setRollbackStatus({message: data.error || "Erro ao realizar rollback.", isError: true});
      }
    } catch {
      setRollbackStatus({message: "Erro de conexão ao realizar rollback.", isError: true});
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR');
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <DefaultLayout>
      <div className="flex flex-col h-full gap-6">
        <PageHeader 
          title="Controle de Revisões" 
          subtitle="Histórico de engenharia, auditoria e recuperação de estados (Rollback)"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* Listagem de Revisões */}
          <Card padding="none" className="lg:col-span-2 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-surface-700 bg-surface-800/50 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-surface-100 uppercase tracking-wider">
                Histórico de Alterações ({totalCount} registros)
              </h3>
              <button 
                onClick={() => fetchLogs(page)}
                className="p-2 rounded-lg hover:bg-surface-700 text-surface-400 transition-colors"
                title="Atualizar"
              >
                🔄
              </button>
            </div>
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              {loading ? (
                <div className="p-8 text-center text-surface-500">Carregando histórico...</div>
              ) : logs.length === 0 ? (
                <div className="p-8 text-center text-surface-500 italic">Nenhuma revisão encontrada.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-surface-900 text-[11px] uppercase text-surface-500 font-bold border-b border-surface-800">
                    <tr>
                      <th className="px-4 py-3">Data/Hora</th>
                      <th className="px-4 py-3">Tabela/Modelo</th>
                      <th className="px-4 py-3">Ação</th>
                      <th className="px-4 py-3">Usuário</th>
                      <th className="px-4 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-surface-800">
                    {logs.map((log) => (
                      <tr 
                        key={log.id} 
                        className={`hover:bg-surface-800/30 transition-colors cursor-pointer ${selectedLog?.id === log.id ? 'bg-surface-800/60' : ''}`}
                        onClick={() => setSelectedLog(log)}
                      >
                        <td className="px-4 py-3 text-surface-400 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-primary-400">{log.tabela}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.acao === 'Criado' ? 'bg-emerald-500/10 text-emerald-500' :
                            log.acao === 'Editado' ? 'bg-amber-500/10 text-amber-500' :
                            log.acao === 'Excluído' ? 'bg-rose-500/10 text-rose-500' :
                            'bg-blue-500/10 text-blue-500'
                          }`}>
                            {log.acao}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-surface-300">{log.usuario}</td>
                        <td className="px-4 py-3">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                            className="text-xs text-surface-500 hover:text-white underline underline-offset-4"
                          >
                            Detalhes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-surface-700 bg-surface-800/50 flex justify-between items-center">
                <span className="text-xs text-surface-500">
                  Página {page} de {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchLogs(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1 text-xs rounded-lg bg-surface-700 text-surface-300 hover:bg-surface-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => fetchLogs(page + 1)}
                    disabled={page >= totalPages}
                    className="px-3 py-1 text-xs rounded-lg bg-surface-700 text-surface-300 hover:bg-surface-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </Card>

          {/* Painel de Detalhes e Rollback */}
          <div className="flex flex-col gap-6 h-full overflow-hidden">
            <Card padding="md" className="flex flex-col h-full overflow-hidden">
              <h3 className="text-sm font-semibold text-surface-100 uppercase tracking-wider mb-4 border-b border-surface-700 pb-2">
                🔎 Detalhamento da Revisão
              </h3>
              
              {selectedLog ? (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="mb-4">
                    <p className="text-[11px] text-surface-500 uppercase font-bold">Registro ID</p>
                    <p className="text-sm text-surface-100 font-mono">#{selectedLog.registro_id}</p>
                  </div>
                  
                  <div className="mb-4 flex-1 flex flex-col min-h-0">
                    <p className="text-[11px] text-surface-500 uppercase font-bold mb-1">Anexo de Alterações</p>
                    <div className="flex-1 bg-surface-950 rounded-xl p-4 border border-surface-800 overflow-y-auto custom-scrollbar font-mono text-xs text-surface-300 leading-relaxed whitespace-pre-wrap">
                      {selectedLog.detalhamento || "Sem detalhamento disponível para esta revisão."}
                    </div>
                  </div>

                  {rollbackStatus && (
                    <div className={`mb-4 p-3 rounded-lg text-xs font-medium animate-in slide-in-from-bottom-2 ${
                      rollbackStatus.isError ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {rollbackStatus.isError ? '❌ ' : '✅ '}{rollbackStatus.message}
                    </div>
                  )}

                  <div className="mt-auto pt-4 border-t border-surface-800">
                    <button 
                      onClick={() => handleRollback(selectedLog.id)}
                      disabled={selectedLog.acao === 'Excluído'}
                      className={`w-full py-3 rounded-xl text-white text-sm font-bold uppercase tracking-widest transition-all shadow-lg ${
                        selectedLog.acao === 'Excluído' 
                          ? 'bg-surface-700 cursor-not-allowed opacity-50' 
                          : 'hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                      style={{ 
                        backgroundColor: selectedLog.acao !== 'Excluído' ? accentColor : undefined,
                        boxShadow: selectedLog.acao !== 'Excluído' ? `0 10px 20px -5px ${accentColor}40` : 'none'
                      }}
                    >
                      Restaurar para este estado
                    </button>
                    {selectedLog.acao === 'Excluído' && (
                      <p className="text-[10px] text-rose-500/70 mt-2 text-center italic">Rollback de exclusão não disponível via snapshot direto.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="text-4xl mb-4 opacity-20">📜</div>
                  <p className="text-surface-500 text-sm italic">Selecione uma revisão para visualizar o detalhamento e opções de recuperação.</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
