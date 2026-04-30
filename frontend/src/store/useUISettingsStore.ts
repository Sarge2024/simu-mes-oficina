import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'dark' | 'light';
export type AccentColor = 'red' | 'blue' | 'green' | 'purple' | 'orange';
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
  accent: 'red',
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
      update: (patch) => set((s) => ({ ...s, ...patch })),
      reset: () => set(DEFAULTS),
    }),
    { name: 'simumes-ui-settings' }
  )
);

// CSS variable mapping for accent colors
export const ACCENT_MAP: Record<AccentColor, { primary: string; glow: string }> = {
  red:    { primary: '#ef4444', glow: 'rgba(239,68,68,0.2)' },
  blue:   { primary: '#6366f1', glow: 'rgba(99,102,241,0.2)' },
  green:  { primary: '#10b981', glow: 'rgba(16,185,129,0.2)' },
  purple: { primary: '#a855f7', glow: 'rgba(168,85,247,0.2)' },
  orange: { primary: '#f97316', glow: 'rgba(249,115,22,0.2)' },
};
