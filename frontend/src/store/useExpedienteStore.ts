import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DaySchedule {
  isOpen: boolean;
  start: string;
  end: string;
}

export interface ExceptionDay {
  isOpen: boolean;
  start?: string;
  end?: string;
}

interface ExpedienteState {
  weeklySchedule: Record<number, DaySchedule>; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  exceptions: Record<string, ExceptionDay>; // format 'YYYY-MM-DD'

  updateWeeklyDay: (dayIndex: number, schedule: Partial<DaySchedule>) => void;
  toggleExceptionDay: (dateStr: string) => void;
}

const DEFAULT_WEEKLY: Record<number, DaySchedule> = {
  0: { isOpen: false, start: '00:00', end: '00:00' }, // Domingo
  1: { isOpen: true,  start: '08:00', end: '18:00' }, // Segunda
  2: { isOpen: true,  start: '08:00', end: '18:00' }, // Terça
  3: { isOpen: true,  start: '08:00', end: '18:00' }, // Quarta
  4: { isOpen: true,  start: '08:00', end: '18:00' }, // Quinta
  5: { isOpen: true,  start: '08:00', end: '18:00' }, // Sexta
  6: { isOpen: false, start: '00:00', end: '00:00' }, // Sábado
};

export const useExpedienteStore = create<ExpedienteState>()(
  persist(
    (set) => ({
      weeklySchedule: DEFAULT_WEEKLY,
      exceptions: {},

      updateWeeklyDay: (dayIndex, schedule) => set((state) => ({
        weeklySchedule: {
          ...state.weeklySchedule,
          [dayIndex]: { ...state.weeklySchedule[dayIndex], ...schedule }
        }
      })),

      toggleExceptionDay: (dateStr) => set((state) => {
        const current = state.exceptions[dateStr];
        // If it exists, remove it. If it doesn't, add it as CLOSED (isOpen: false)
        if (current) {
          const newExceptions = { ...state.exceptions };
          delete newExceptions[dateStr];
          return { exceptions: newExceptions };
        } else {
          return {
            exceptions: {
              ...state.exceptions,
              [dateStr]: { isOpen: false }
            }
          };
        }
      })
    }),
    { name: 'simumes-expediente' }
  )
);
