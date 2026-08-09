import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Trophy } from 'lucide-react';
import { useTopEquipos } from '@/features/estadisticas/hooks/useEstadisticas';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

const LIMIT_OPTIONS = [5, 10, 15];

const BAR_COLORS = [
  'bg-primary-400',
  'bg-primary-500',
  'bg-primary-600',
  'bg-primary-700',
  'bg-primary-300',
];

export function EstadisticasPage() {
  const { t } = useTranslation();
  const [limit, setLimit] = useState(5);
  const query = useTopEquipos(limit);
  const data = query.data ?? [];
  const max = Math.max(1, ...data.map((d) => d.totalReservas));

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t('estadisticas.title')}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t('estadisticas.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="limit" className="text-sm font-medium text-ink-muted">
            {t('estadisticas.limit')}
          </label>
          <select
            id="limit"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="h-10 rounded-xl border border-surface-line bg-surface-card px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {LIMIT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </header>

      <Card className="p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-2 text-base font-semibold text-ink">
          <Trophy className="h-5 w-5 text-state-warning" aria-hidden />
          {t('estadisticas.top', { limit })}
        </div>

        {query.isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner label={t('common.loading')} />
          </div>
        ) : query.isError ? (
          <ErrorState message={t('auth.networkError')} onRetry={() => query.refetch()} />
        ) : data.length === 0 ? (
          <EmptyState title={t('estadisticas.noData')} icon={<BarChart3 className="h-7 w-7" aria-hidden />} />
        ) : (
          <ol className="flex flex-col gap-4">
            {data.map((item, idx) => {
              const widthPct = Math.round((item.totalReservas / max) * 100);
              return (
                <li key={item.idEquipo} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white',
                          BAR_COLORS[idx % BAR_COLORS.length]
                        )}
                      >
                        {idx + 1}
                      </span>
                      <span className="truncate text-sm font-medium text-ink">
                        {item.nombre}
                      </span>
                      {item.categoria && (
                        <Badge tone="neutral" className="hidden sm:inline-flex">
                          {item.categoria}
                        </Badge>
                      )}
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-primary-dark">
                      {t('estadisticas.count', { count: item.totalReservas })}
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-surface-line/60">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500 ease-smooth',
                        BAR_COLORS[idx % BAR_COLORS.length]
                      )}
                      style={{ width: `${widthPct}%` }}
                      role="progressbar"
                      aria-valuenow={item.totalReservas}
                      aria-valuemin={0}
                      aria-valuemax={max}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Card>
    </div>
  );
}
