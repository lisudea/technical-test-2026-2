import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'disponible' | 'reservado' | 'mantenimiento' | 'warning';

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
  tone?: Tone;
  /** Rendered under the value — use for a short qualifier, not a paragraph. */
  hint?: string;
}

const TONES: Record<Tone, string> = {
  neutral: 'text-ink bg-surface-line/50',
  disponible: 'text-state-disponible bg-state-disponible/10',
  reservado: 'text-state-reservado bg-state-reservado/10',
  mantenimiento: 'text-state-mantenimiento bg-state-mantenimiento/10',
  warning: 'text-state-warning bg-state-warning/10',
};

/**
 * A single number with its label — the unit the consoles are built from.
 *
 * The tone is a deliberate signal, not decoration: `reservado` is reserved
 * for counters that mean something needs attention (equipment not returned,
 * sanctions in force), so a glance at the row tells you whether the lab is
 * fine without reading a single label.
 */
export function StatCard({ label, value, icon, tone = 'neutral', hint }: StatCardProps) {
  return (
    <div className="card-base flex items-center gap-3.5 p-4">
      {icon && (
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            TONES[tone]
          )}
          aria-hidden
        >
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-tight text-ink">{value}</p>
        <p className="truncate text-xs font-medium text-ink-muted">{label}</p>
        {hint && <p className="truncate text-xs text-ink-muted/80">{hint}</p>}
      </div>
    </div>
  );
}
