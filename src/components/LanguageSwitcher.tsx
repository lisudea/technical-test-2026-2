import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppLang } from '@/i18n/i18n';

interface LanguageSwitcherProps {
  current: AppLang;
  options: readonly AppLang[];
}

const FLAGS: Record<AppLang, string> = {
  es: '🇪🇸',
  en: '🇬🇧',
};

export function LanguageSwitcher({ current, options }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation();

  const cycle = () => {
    const idx = options.indexOf(current);
    const next = options[(idx + 1) % options.length];
    i18n.changeLanguage(next);
  };

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={t('common.language')}
      title={t('common.language')}
      className="flex items-center gap-1.5 rounded-xl border border-surface-line bg-surface-card px-2.5 py-2 text-sm font-medium text-ink-soft transition-colors hover:border-primary/50 hover:text-primary-dark"
    >
      <Globe className="h-4 w-4" aria-hidden />
      <span className={cn('text-base leading-none')}>{FLAGS[current]}</span>
      <span className="uppercase">{current}</span>
    </button>
  );
}
