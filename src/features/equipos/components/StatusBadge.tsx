import { CheckCircle2, Lock, Wrench, CircleSlash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import type { EstadoEquipo } from '@/lib/types';

const CONFIG: Record<
  EstadoEquipo,
  { tone: 'disponible' | 'reservado' | 'mantenimiento'; icon: React.ReactNode }
> = {
  DISPONIBLE: { tone: 'disponible', icon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> },
  MANTENIMIENTO: { tone: 'mantenimiento', icon: <Wrench className="h-3.5 w-3.5" aria-hidden /> },
  BAJA: { tone: 'reservado', icon: <CircleSlash className="h-3.5 w-3.5" aria-hidden /> },
};

export function StatusBadge({ estado }: { estado: EstadoEquipo }) {
  const { t } = useTranslation();
  const cfg = CONFIG[estado];
  return (
    <Badge tone={cfg.tone} icon={cfg.icon}>
      {t(`status.${estado}`)}
    </Badge>
  );
}

/** Convenience accessor for the disabled-reserve reason hint. */
export function statusHintKey(estado: EstadoEquipo): string {
  return `statusHint.${estado}`;
}

/** Re-export Lock for callers that want a visual "locked" hint on disabled buttons. */
export { Lock };
