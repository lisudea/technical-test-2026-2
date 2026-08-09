import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, totalPages, onChange, className }: PaginationProps) {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;

  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  return (
    <nav
      aria-label={t('common.page')}
      className={cn('flex items-center justify-center gap-2 sm:justify-end', className)}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange(page - 1)}
        disabled={!canPrev}
        iconLeft={<ChevronLeft className="h-4 w-4" aria-hidden />}
        aria-label={t('common.prev')}
      >
        <span className="hidden sm:inline">{t('common.prev')}</span>
      </Button>
      <span className="px-2 text-sm text-ink-muted">
        {t('common.page')} {page + 1} {t('common.of')} {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange(page + 1)}
        disabled={!canNext}
        iconRight={<ChevronRight className="h-4 w-4" aria-hidden />}
        aria-label={t('common.next')}
      >
        <span className="hidden sm:inline">{t('common.next')}</span>
      </Button>
    </nav>
  );
}
