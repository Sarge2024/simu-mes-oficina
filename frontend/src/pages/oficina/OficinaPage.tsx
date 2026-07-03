import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DefaultLayout from '../../layouts/DefaultLayout';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';
import { useExpedienteStore } from '../../store/useExpedienteStore';
import { useAgendaStore } from '../../store/useAgendaStore';
import PageHeader from '../../components/shared/PageHeader';
import Card from '../../components/shared/Card';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

ModuleRegistry.registerModules([AllCommunityModule]);


interface OSTimerState {
  isRunning: boolean;
  activeStageIndex: number;
}

export default function OficinaPage() {
  const navigate = useNavigate();
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
    'Aguardando Início': 'border-surface-500/40 bg-surface-500/5',
  };

  const dotColors: Record<string, string> = {
    'Em Diagnóstico': 'bg-warning-400',
    'Aguardando Aprovação': 'bg-primary-400',
    'Em Execução': 'bg-accent-400',
    'Concluída': 'bg-surface-600',
    'Aguardando Peça': 'bg-danger-400',
    'Aguardando Início': 'bg-surface-500',
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
      const currentState = prev[osId];
      const isCurrentlyRunning = currentState?.isRunning && currentState?.activeStageIndex === stageIndex;
      return { ...prev, [osId]: { isRunning: !isCurrentlyRunning, activeStageIndex: stageIndex } };
    });
  };

  const selectStage = (osId: number, stageIndex: number) => {
    setTimers(prev => {
      const currentState = prev[osId] || { isRunning: false };
      return { ...prev, [osId]: { ...currentState, activeStageIndex: stageIndex } };
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
        <div className="flex flex-col h-full">
          <PageHeader 
            title="🔧 Boxes de Manutenção" 
            subtitle="Selecione o Box / OS que você irá operar" 
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-6">
            {boxes.map((box) => {
              const isOcupado = box.os !== '';
              const etapas = [
                { name: 'Triagem', inicio: null, duracao: 0, concluido: false },
                { name: 'Diagnóstico', inicio: null, duracao: 0, concluido: false },
                { name: 'Execução', inicio: null, duracao: 0, concluido: false },
              ];

              return (
                <Card 
                  key={box.box}
                  padding="none"
                  hover={isOcupado}
                  className={`flex flex-col overflow-hidden border-t-4 border-t-primary-300 ${!isOcupado ? 'opacity-70 border-dashed bg-primary-300/5' : 'bg-primary-300/10 shadow-lg shadow-primary-300/10'}`}
                  onClick={() => isOcupado && setSelectedOSId(parseInt(box.os))}
                >
                  <div className="p-4 sm:p-6 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-surface-100">{box.box}</h2>
                      <div className="flex flex-col items-end gap-2">
                        {isOcupado ? (
                          <>
                            <span className="text-xs font-mono px-2 py-1 bg-primary-300/20 text-primary-300 rounded">OS #{box.os}</span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm border ${
                              box.status === 'Aguardando Início' ? 'border-surface-500 text-surface-400 bg-surface-500/10' :
                              box.status === 'Em Execução' ? 'border-accent-500 text-accent-400 bg-accent-500/10' :
                              box.status === 'Diagnóstico' ? 'border-warning-500 text-warning-400 bg-warning-500/10' :
                              'border-surface-700 text-surface-500 bg-surface-800'
                            }`}>
                              {box.status}
                            </span>
                          </>
                        ) : (
                          <span className="text-[10px] px-2 py-1 bg-accent-500/10 text-accent-400 rounded font-black uppercase">Livre</span>
                        )}
                      </div>
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
                </Card>
              );
            })}
          </div>
        </div>
      </DefaultLayout>
    );
  }

  const defaultEtapas = [
    { name: 'Triagem', inicio: null, concluido: true },
    { name: 'Diagnóstico', inicio: null, concluido: false },
    { name: 'Execução', inicio: null, concluido: false },
  ];

  const currentEtapas = selectedBox.etapas || defaultEtapas;
  const activeStageIdx = currentTimerState?.activeStageIndex ?? currentEtapas.findIndex(e => !e.concluido);
  const safeStageIdx = activeStageIdx === -1 ? currentEtapas.length - 1 : activeStageIdx;
  const currentStage = currentEtapas[safeStageIdx];
  const isRunning = currentTimerState?.isRunning ?? false;

  return (
    <DefaultLayout>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <PageHeader 
          title={`🔧 ${selectedBox.box} — OS #${selectedBox.os}`}
          subtitle={`Apontamento individual: ${selectedBox.veiculo}`}
          onBack={() => setSelectedOSId(null)}
        />
        
        <div className={`shrink-0 px-4 py-2 rounded-lg border flex items-center gap-2 self-start lg:self-center ${statusColors[selectedBox.status] || 'border-surface-600 bg-surface-800'}`}>
          {!isWithinWorkingHours() && (
             <span className="text-xs bg-warning-500/20 text-warning-400 px-2 py-1 rounded font-bold mr-2">Fora de Expediente (Pausado)</span>
          )}
          <div className={`w-2.5 h-2.5 rounded-full ${dotColors[selectedBox.status] || 'bg-surface-500'}`} />
          <span className="text-sm font-medium text-surface-100">{selectedBox.status}</span>
        </div>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card padding="md" className="flex flex-col shadow-2xl">
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
                  <label key={idx} className={`flex justify-between items-center p-1.5 rounded cursor-pointer transition-colors ${idx === safeStageIdx ? 'bg-surface-800 text-surface-100' : 'text-surface-500 hover:bg-surface-800/50'}`}>
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="stageSelector" 
                        checked={idx === safeStageIdx} 
                        onChange={() => selectStage(parseInt(selectedBox.os), idx)}
                        className="w-3 h-3 text-primary-500 focus:ring-primary-500 bg-surface-900 border-surface-700"
                      />
                      <span>{etp.name}</span>
                    </div>
                    <span className="font-mono">{formatTime(getDuration(selectedBox.os, idx))}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-surface-800">
              <button 
                onClick={() => navigate(`/oficina/fechamento/${selectedBox.os}`)}
                className="w-full py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-500 transition-colors shadow-lg"
              >
                ✓ Concluir OS e Faturar
              </button>
            </div>
          </Card>

          <Card padding="md" className="lg:col-span-2">
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
          </Card>
        </div>
    </DefaultLayout>
  );
}
