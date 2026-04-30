import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import DefaultLayout from '../../layouts/DefaultLayout';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';
import { useExpedienteStore } from '../../store/useExpedienteStore';
import { useAgendaStore } from '../../store/useAgendaStore';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

ModuleRegistry.registerModules([AllCommunityModule]);


interface OSTimerState {
  isRunning: boolean;
  activeStageIndex: number;
}

export default function OficinaPage() {
  const { weeklySchedule, exceptions } = useExpedienteStore();
  const { boxes } = useAgendaStore();
  
  const [selectedOSId, setSelectedOSId] = useState<number | null>(null);
  const [timers, setTimers] = useState<Record<number, OSTimerState>>({});
  const [stageDurations, setStageDurations] = useState<Record<string, number>>({}); // osId-stageIdx -> duration
  
  const timersRef = useRef(timers);

  useEffect(() => {
    timersRef.current = timers;
  }, [timers]);

  // Lógica de verificação de horário de expediente com base no Quadro Semanal e Feriados Anuais
  const isWithinWorkingHours = useCallback(() => {
    const now = new Date();
    
    // 1. Checar se hoje é um Feriado/Inoperante (Exception)
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const exception = exceptions[dateStr];
    if (exception && !exception.isOpen) {
      return false; // Feriado / Inoperante
    }

    // 2. Checar Quadro Semanal (0=Dom, 1=Seg...)
    const dayOfWeek = now.getDay();
    const schedule = weeklySchedule[dayOfWeek];
    
    // Se o dia está marcado como inativo no quadro semanal
    if (!schedule || !schedule.isOpen) {
      return false; 
    }

    // 3. Validar a janela de horário do dia ativo
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = schedule.start.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const [endH, endM] = schedule.end.split(':').map(Number);
    const endMins = endH * 60 + endM;

    return currentMins >= startMins && currentMins < endMins;
  }, [exceptions, weeklySchedule]);

  // Global Tick for all running OSs
  useEffect(() => {
    const interval = setInterval(() => {
      // Se não estiver dentro do horário de expediente, não incrementa nenhum relógio
      if (!isWithinWorkingHours()) return;

      // Atualiza as durações no estado local
      setStageDurations(prev => {
        const next = { ...prev };
        boxes.forEach(box => {
          if (box.os) {
            const osId = parseInt(box.os);
            const t = timersRef.current[osId];
            if (t?.isRunning) {
              const key = `${osId}-${t.activeStageIndex}`;
              next[key] = (next[key] || 0) + 1;
            }
          }
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isWithinWorkingHours]);

  const defaultColDef = useMemo(() => ({ sortable: true, filter: true, resizable: true }), []);

  const statusColors: Record<string, string> = {
    'Em Diagnóstico': 'border-warning-400/40 bg-warning-400/5',
    'Aguardando Aprovação': 'border-primary-400/40 bg-primary-400/5',
    'Em Execução': 'border-accent-400/40 bg-accent-400/5',
    'Concluída': 'border-surface-600/40 bg-surface-800/30',
    'Aguardando Peça': 'border-danger-400/40 bg-danger-400/5',
  };

  const dotColors: Record<string, string> = {
    'Em Diagnóstico': 'bg-warning-400',
    'Aguardando Aprovação': 'bg-primary-400',
    'Em Execução': 'bg-accent-400',
    'Concluída': 'bg-surface-600',
    'Aguardando Peça': 'bg-danger-400',
  };

  const getDuration = (osId: string | number, stageIdx: number) => {
    return stageDurations[`${osId}-${stageIdx}`] || 0;
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };



  const toggleTimer = (osId: number, stageIndex: number) => {
    setTimers(prev => {
      // Se for iniciar, podemos disparar ações extras se necessário
      return { ...prev, [osId]: { isRunning: true, activeStageIndex: stageIndex } };
    });
  };

  const resetTimerAction = (osId: number, stageIndex: number) => {
    setTimers(prev => ({ ...prev, [osId]: { isRunning: false, activeStageIndex: stageIndex } }));
    const key = `${osId}-${stageIndex}`;
    setStageDurations(prev => ({ ...prev, [key]: 0 }));
  };

  const selectedBox = selectedOSId ? boxes.find(b => parseInt(b.os) === selectedOSId) : null;
  const currentTimerState = selectedOSId ? timers[selectedOSId] : null;

  if (!selectedBox) {
    return (
      <DefaultLayout>
        <div className="p-6 h-full flex flex-col">
          <header className="mb-8">
            <h1 className="text-2xl font-bold text-surface-50">🔧 Boxes de Manutenção</h1>
            <p className="text-sm text-surface-500 mt-1">Selecione o Box / OS que você irá operar</p>
          </header>

          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
            {boxes.map((box) => {
              const isOcupado = box.os !== '';
              // Mock stages for new allocations
              const etapas = [
                { name: 'Triagem', inicio: null, duracao: 0, concluido: false },
                { name: 'Diagnóstico', inicio: null, duracao: 0, concluido: false },
                { name: 'Execução', inicio: null, duracao: 0, concluido: false },
              ];

              return (
                <div 
                  key={box.box}
                  onClick={() => isOcupado && setSelectedOSId(parseInt(box.os))}
                  className={`bg-surface-900 border border-surface-700 rounded-xl p-6 transition-all flex flex-col ${
                    isOcupado 
                      ? 'cursor-pointer hover:scale-[1.01] hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10' 
                      : 'opacity-60 grayscale border-dashed'
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-surface-100">{box.box}</h2>
                    {isOcupado ? (
                      <span className="text-xs font-mono px-2 py-1 bg-surface-800 text-primary-400 rounded">OS #{box.os}</span>
                    ) : (
                      <span className="text-[10px] px-2 py-1 bg-accent-500/10 text-accent-400 rounded font-black uppercase">Livre</span>
                    )}
                  </div>
                  
                  {isOcupado ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-surface-500">Veículo</p>
                          <p className="text-sm text-surface-200 font-medium truncate">{box.veiculo}</p>
                        </div>
                        <div>
                          <p className="text-xs text-surface-500">Colaborador</p>
                          <p className="text-sm text-surface-200 font-medium">{box.mecanico}</p>
                        </div>
                      </div>

                      <div className="mb-6 bg-surface-950 rounded-lg p-3 border border-surface-800">
                        <p className="text-xs text-surface-500 mb-2 font-semibold">Cronograma de Etapas</p>
                        <div className="space-y-2">
                          {etapas.map((etapa, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-surface-400">▶</span>
                                <span className="text-surface-200">{etapa.name}</span>
                              </div>
                              <div className="flex gap-3 text-surface-500 font-mono">
                                <span>--/-- --:--</span>
                                <span className="w-16 text-right">
                                  {formatTime(getDuration(box.os, idx))}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={`mt-auto p-3 rounded-lg border flex items-center justify-between ${statusColors[box.status] || 'border-surface-600 bg-surface-800'}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${dotColors[box.status] || 'bg-surface-500'}`} />
                          <span className="text-sm font-medium text-surface-100">{box.status}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-8">
                      <span className="text-4xl mb-2 opacity-20">📥</span>
                      <p className="text-sm text-surface-500">Aguardando veículo...</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DefaultLayout>
    );
  }

  // Lista padrão de etapas caso o box não tenha uma específica
  const defaultEtapas = [
    { name: 'Triagem', inicio: null, concluido: true },
    { name: 'Diagnóstico', inicio: null, concluido: false },
    { name: 'Execução', inicio: null, concluido: false },
  ];

  const currentEtapas = selectedBox.etapas || defaultEtapas;

  // Descobrindo a etapa atual da OS
  const activeStageIdx = currentTimerState?.activeStageIndex ?? currentEtapas.findIndex(e => !e.concluido);
  const safeStageIdx = activeStageIdx === -1 ? currentEtapas.length - 1 : activeStageIdx;
  const currentStage = currentEtapas[safeStageIdx];
  const isRunning = currentTimerState?.isRunning ?? false;

  return (
    <DefaultLayout>
      <div className="p-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button 
                onClick={() => setSelectedOSId(null)}
                className="p-1.5 rounded bg-surface-800 text-surface-400 hover:text-white transition-colors"
                title="Voltar para a seleção de Box"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-surface-50">🔧 {selectedBox.box} — OS #{selectedBox.os}</h1>
            </div>
            <p className="text-sm text-surface-500 ml-10">Apontamento individual: {selectedBox.veiculo}</p>
          </div>
          
          <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${statusColors[selectedBox.status] || 'border-surface-600 bg-surface-800'}`}>
            {!isWithinWorkingHours() && (
               <span className="text-xs bg-warning-500/20 text-warning-400 px-2 py-1 rounded font-bold mr-2">Fora de Expediente (Pausado)</span>
            )}
            <div className={`w-2.5 h-2.5 rounded-full ${dotColors[selectedBox.status] || 'bg-surface-500'}`} />
            <span className="text-sm font-medium text-surface-100">{selectedBox.status}</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Terminal de Apontamento Individualizado */}
          <div className="bg-surface-900 border border-surface-700 rounded-xl p-6 shadow-2xl flex flex-col">
            <h2 className="text-lg font-semibold text-surface-100 mb-4">⏱️ Apontamento ({currentStage.name})</h2>
            
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="mb-2">
                <span className="text-xs text-surface-500">Início: {currentStage.inicio || 'Aguardando'}</span>
              </div>
              <p className={`text-5xl font-mono font-bold mb-6 tracking-wider ${isRunning ? 'text-accent-400 animate-pulse' : 'text-surface-300'}`}>
                {formatTime(getDuration(selectedBox.os, safeStageIdx))}
              </p>
              
              <div className="flex gap-3 justify-center w-full">
                {!isRunning ? (
                  <button onClick={() => toggleTimer(parseInt(selectedBox.os), safeStageIdx)} className="flex-1 py-3 rounded-xl bg-accent-600 text-white text-sm font-semibold hover:bg-accent-500 transition-colors shadow-lg shadow-accent-500/20">
                    ▶ Iniciar Etapa
                  </button>
                ) : (
                  <button onClick={() => toggleTimer(parseInt(selectedBox.os), safeStageIdx)} className="flex-1 py-3 rounded-xl bg-danger-500 text-white text-sm font-semibold hover:bg-danger-400 transition-colors shadow-lg shadow-danger-500/20">
                    ⏸ Pausar Etapa
                  </button>
                )}
                <button onClick={() => resetTimerAction(parseInt(selectedBox.os), safeStageIdx)} className="px-4 py-3 rounded-xl bg-surface-800 border border-surface-700 text-surface-300 text-sm hover:bg-surface-700 transition-colors">
                  ↺
                </button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-surface-800">
              <p className="text-xs text-surface-500 font-semibold uppercase mb-2">Todas as Etapas</p>
              <div className="space-y-1 text-xs">
                {currentEtapas.map((etp, idx) => (
                  <div key={idx} className={`flex justify-between p-1.5 rounded ${idx === safeStageIdx ? 'bg-surface-800 text-surface-100' : 'text-surface-500'}`}>
                    <span>{etp.name}</span>
                    <span className="font-mono">{formatTime(getDuration(selectedBox.os, idx))}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Orçamento Grid */}
          <div className="bg-surface-900 border border-surface-700 rounded-xl p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-surface-100 mb-4">📝 Orçamento V1.0</h2>
            <div className="ag-theme-alpine-dark w-full" style={{ height: '350px' }}>
              <AgGridReact
                rowData={[
                  { tipo: '🔩 Peça', desc: 'Kit Embreagem Completo', qtd: 1, unit: 850.00, est: 'R$ 1.105,00', flag: '✅ Estoque' },
                  { tipo: '🔩 Peça', desc: 'Óleo Câmbio 75W90 (2L)', qtd: 2, unit: 32.00, est: 'R$ 83,20', flag: '✅ Estoque' },
                  { tipo: '🛠️ MO', desc: 'Troca de Embreagem (4h)', qtd: 4, unit: 120.00, est: 'R$ 480,00', flag: '—' },
                  { tipo: '🏭 3º', desc: 'Usinagem do Volante', qtd: 1, unit: 350.00, est: 'R$ 350,00', flag: '⚡ JIT' },
                ]}
                columnDefs={[
                  { field: 'tipo', headerName: 'Tipo', width: 80 },
                  { field: 'desc', headerName: 'Descrição', flex: 1 },
                  { field: 'qtd', headerName: 'Qtd', width: 60 },
                  { field: 'unit', headerName: 'Unit (R$)', width: 100 },
                  { field: 'est', headerName: 'Estimado', width: 110 },
                  { field: 'flag', headerName: 'Estoque', width: 100 },
                ] as ColDef[]}
                defaultColDef={defaultColDef}
              />
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
