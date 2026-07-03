import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

/**
 * Standard Page Header with optional back button and subtitle.
 */
export default function PageHeader({ title, subtitle, showBackButton, onBack }: PageHeaderProps) {
  const shouldShowBack = showBackButton ?? !!onBack;
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="mb-6 sm:mb-8 flex items-start gap-3 sm:gap-4">
      {shouldShowBack && (
        <button 
          onClick={handleBack}
          className="mt-0.5 sm:mt-1 p-1.5 sm:p-2 rounded-lg bg-surface-900 border border-surface-700 text-surface-400 hover:text-primary-400 hover:border-primary-400/50 transition-all group shrink-0"
          aria-label="Voltar"
          title="Voltar"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      )}
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-surface-50 leading-tight truncate">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-surface-500 mt-1 line-clamp-1">{subtitle}</p>}
      </div>
    </header>
  );
}
