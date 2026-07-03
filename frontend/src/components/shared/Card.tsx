import type { ReactNode } from 'react';
import { useUISettingsStore, ACCENT_MAP } from '../../store/useUISettingsStore';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  accentBorder?: boolean;
  onClick?: () => void;
}

export default function Card({ 
  children, 
  className = '', 
  padding = 'md',
  hover = false,
  accentBorder = false,
  onClick
}: CardProps) {
  const { cardStyle, accent, compactMode } = useUISettingsStore();
  const accentColor = ACCENT_MAP[accent]?.primary || '#6366f1';

  const getPadding = () => {
    if (padding === 'none') return 'p-0';
    
    if (compactMode) {
      switch (padding) {
        case 'sm':   return 'p-1.5';
        case 'md':   return 'p-3';
        case 'lg':   return 'p-4 sm:p-6';
        default:     return 'p-3';
      }
    }

    switch (padding) {
      case 'sm':   return 'p-3';
      case 'md':   return 'p-4 sm:p-6';
      case 'lg':   return 'p-6 sm:p-8';
      default:     return 'p-4 sm:p-6';
    }
  };

  const getCardStyleClasses = () => {
    switch (cardStyle) {
      case 'sharp':
        return 'rounded-none bg-primary-300/10 border-surface-700';
      case 'glass':
        return 'rounded-2xl bg-primary-300/10 backdrop-blur-xl border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]';
      case 'rounded':
      default:
        return 'rounded-xl bg-primary-300/10 border-surface-700';
    }
  };

  const borderStyle = accentBorder 
    ? { borderTopColor: accentColor, borderTopWidth: '3px' } 
    : {};

  return (
    <div 
      className={`
        border transition-all duration-300
        ${getCardStyleClasses()}
        ${getPadding()}
        ${hover || onClick ? 'hover:border-primary-500/30 hover:scale-[1.01] hover:shadow-xl cursor-pointer' : ''}
        ${className}
      `}
      style={borderStyle}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
