import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'disponible' | 'reservado' | 'mantenimiento' | 'warning' | 'neutral';

interface BadgeProps {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

const TONES: Record<Tone, { wrap: string; dot: string }> = {
  disponible: {
    wrap: 'bg-state-disponible/10 text-state-disponible border-state-disponible/25',
    dot: 'bg-state-disponible',
  },
  reservado: {
    wrap: 'bg-state-reservado/10 text-state-reservado border-state-reservado/25',
    dot: 'bg-state-reservado',
  },
  mantenimiento: {
    wrap: 'bg-state-mantenimiento/10 text-state-mantenimiento border-state-mantenimiento/25',
    dot: 'bg-state-mantenimiento',
  },
  warning: {
    wrap: 'bg-state-warning/10 text-state-warning border-state-warning/25',
    dot: 'bg-state-warning',
  },
  neutral: {
    wrap: 'bg-surface-line/50 text-ink-soft border-surface-line',
    dot: 'bg-ink-muted',
  },
};

export function Badge({ tone = 'neutral', icon, children, className }: BadgeProps) {
  const t = TONES[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
        t.wrap,
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
