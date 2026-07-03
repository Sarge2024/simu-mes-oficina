import { useMemo } from 'react';
import DefaultLayout from '../../layouts/DefaultLayout';
import { useExpedienteStore } from '../../store/useExpedienteStore';
import PageHeader from '../../components/shared/PageHeader';
import Card from '../../components/shared/Card';

const DAYS_OF_WEEK = [
  { idx: 1, name: 'Segunda-feira' },
  { idx: 2, name: 'Terça-feira' },
  { idx: 3, name: 'Quarta-feira' },
  { idx: 4, name: 'Quinta-feira' },
  { idx: 5, name: 'Sexta-feira' },
  { idx: 6, name: 'Sábado' },
  { idx: 0, name: 'Domingo' },
];

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function ExpedientePage() {
  const { weeklySchedule, exceptions, updateWeeklyDay, toggleExceptionDay } = useExpedienteStore();

  const currentYear = new Date().getFullYear();

  // Helper to generate calendar grid (months and days)
  const calendarMonths = useMemo(() => {
    const months = [];
    for (let m = 0; m < 12; m++) {
      const days = [];
      const numDays = new Date(currentYear, m + 1, 0).getDate();
      
      for (let d = 1; d <= numDays; d++) {
        const dateStr = `${currentYear}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayOfWeek = new Date(currentYear, m, d).getDay();
        days.push({
          day: d,
          dateStr,
          isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
          isException: !!exceptions[dateStr],
        });
      }
      months.push({ name: MONTHS[m], days });
    }
    return months;
  }, [currentYear, exceptions]);

  return (
    <DefaultLayout>
      <div className="max-w-6xl mx-auto flex flex-col h-full">
        <PageHeader 
          title="📅 Configuração de Expediente" 
          subtitle="Gerencie os horários da Oficina e os dias inoperantes no calendário" 
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
          {/* Quadro Semanal */}
          <Card padding="md" className="lg:col-span-1 flex flex-col h-full overflow-y-auto">
            <h2 className="text-lg font-semibold text-surface-100 mb-6 flex items-center gap-2">
              <span>⏱️</span> Quadro Semanal
            </h2>
            
            <div className="space-y-4">
              {DAYS_OF_WEEK.map((day) => {
                const schedule = weeklySchedule[day.idx];
                return (
                  <div key={day.idx} className={`p-4 rounded-lg border transition-colors ${schedule.isOpen ? 'border-surface-600 bg-surface-800' : 'border-surface-800 bg-surface-950/50 opacity-60'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-surface-200">{day.name}</span>
                      <button 
                        onClick={() => updateWeeklyDay(day.idx, { isOpen: !schedule.isOpen })}
                        className={`relative w-10 h-5 rounded-full transition-colors ${schedule.isOpen ? 'bg-primary-600' : 'bg-surface-700'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${schedule.isOpen ? 'translate-x-5' : ''}`} />
                      </button>
                    </div>
                    {schedule.isOpen ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="time" 
                          value={schedule.start}
                          onChange={(e) => updateWeeklyDay(day.idx, { start: e.target.value })}
                          className="bg-surface-900 border border-surface-700 text-surface-200 text-sm rounded px-2 py-1 w-full focus:outline-none focus:border-primary-500"
                        />
                        <span className="text-surface-500 text-xs">às</span>
                        <input 
                          type="time" 
                          value={schedule.end}
                          onChange={(e) => updateWeeklyDay(day.idx, { end: e.target.value })}
                          className="bg-surface-900 border border-surface-700 text-surface-200 text-sm rounded px-2 py-1 w-full focus:outline-none focus:border-primary-500"
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-surface-500 text-center py-1">Sem Expediente</p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Calendário Anual */}
          <Card padding="md" className="lg:col-span-2 flex flex-col h-full overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-surface-100 flex items-center gap-2">
                <span>🗓️</span> Calendário de Feriados ({currentYear})
              </h2>
              <div className="flex items-center gap-4 text-xs text-surface-400">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-surface-800 border border-surface-600" /> Expediente Normal</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-danger-500/20 border border-danger-500" /> Inoperante (Feriado)</div>
              </div>
            </div>

            <p className="text-sm text-surface-400 mb-6">
              Clique nos dias para marcá-los como inoperantes. Nestes dias, nenhum cronômetro de OS irá rodar, independentemente do Quadro Semanal.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pr-2 pb-6">
              {calendarMonths.map((month, i) => (
                <div key={i} className="bg-surface-950 p-3 rounded-xl border border-surface-800">
                  <h3 className="text-sm font-semibold text-surface-200 mb-2 text-center">{month.name}</h3>
                  <div className="grid grid-cols-7 gap-1">
                    {['D','S','T','Q','Q','S','S'].map((dw, i) => (
                      <div key={i} className="text-[10px] text-center text-surface-500 font-bold mb-1">{dw}</div>
                    ))}
                    {/* Empty slots for month start padding */}
                    {Array.from({ length: new Date(currentYear, i, 1).getDay() }).map((_, emptyIdx) => (
                      <div key={`empty-${emptyIdx}`} />
                    ))}
                    {/* Days */}
                    {month.days.map((day) => {
                      const isExc = day.isException;
                      const isWk = day.isWeekend;
                      return (
                        <button
                          key={day.dateStr}
                          onClick={() => toggleExceptionDay(day.dateStr)}
                          className={`
                            aspect-square rounded text-xs flex items-center justify-center transition-all border
                            ${isExc ? 'bg-danger-500/20 text-danger-400 border-danger-500 hover:bg-danger-500/30 font-bold' 
                                    : isWk ? 'bg-surface-900/50 text-surface-500 border-transparent hover:border-surface-600' 
                                           : 'bg-surface-800 text-surface-300 border-surface-700 hover:border-primary-500/50 hover:bg-surface-700'
                            }
                          `}
                          title={day.dateStr}
                        >
                          {day.day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DefaultLayout>
  );
}
