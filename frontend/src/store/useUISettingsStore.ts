import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'dark' | 'light';
export type AccentColor = 'indigo-violet' | 'emerald-teal' | 'sunset-rose' | 'ocean-cyan' | 'amber-orange';
export type SidebarStyle = 'icons' | 'expanded';
export type CardStyle = 'rounded' | 'sharp' | 'glass';

interface UISettings {
  theme: ThemeMode;
  accent: AccentColor;
  sidebar: SidebarStyle;
  cardStyle: CardStyle;
  compactMode: boolean;
  animationsEnabled: boolean;
  showWelcome: boolean;
  chartStyle: 'filled' | 'outlined';
  workingHoursStart: string;
  workingHoursEnd: string;
}

interface UISettingsState extends UISettings {
  update: (patch: Partial<UISettings>) => void;
  reset: () => void;
}

const DEFAULTS: UISettings = {
  theme: 'dark',
  accent: 'indigo-violet',
  sidebar: 'icons',
  cardStyle: 'rounded',
  compactMode: false,
  animationsEnabled: true,
  showWelcome: true,
  chartStyle: 'filled',
  workingHoursStart: '08:00',
  workingHoursEnd: '18:00',
};

export const useUISettingsStore = create<UISettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      update: (patch) => set((state) => ({ ...state, ...patch })),
      reset: () => set(DEFAULTS),
    }),
    {
      name: 'simumes-ui-settings',
      partialize: (state) => {
        const { update, reset, ...settings } = state;
        return settings;
      },
      // Ensure we hydrate before the first render or handle it
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('UISettings hydrated:', state);
        }
      }
    }
  )
);

// CSS variable mapping for accent colors (Palettes)
export const ACCENT_MAP: Record<AccentColor, { name: string; primary: string; secondary: string; box: string; glow: string }> = {
  'indigo-violet': { name: 'Midnight Indigo', primary: '#6366f1', secondary: '#8b5cf6', box: '#a5b4fc', glow: 'rgba(99,102,241,0.2)' },
  'emerald-teal':  { name: 'Forest Emerald', primary: '#10b981', secondary: '#14b8a6', box: '#6ee7b7', glow: 'rgba(16,185,129,0.2)' },
  'sunset-rose':   { name: 'Sunset Ember',   primary: '#ef4444', secondary: '#f43f5e', box: '#fca5a5', glow: 'rgba(239,68,68,0.2)' },
  'ocean-cyan':    { name: 'Cyber Ocean',    primary: '#0ea5e9', secondary: '#06b6d4', box: '#7dd3fc', glow: 'rgba(14,165,233,0.2)' },
  'amber-orange':  { name: 'Golden Amber',   primary: '#f59e0b', secondary: '#f97316', box: '#fcd34d', glow: 'rgba(245,158,11,0.2)' },
};
