import { Clock, PackageCheck, PackageOpen, UserX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import type { EstadoPrestamo } from '@/lib/types';

const CONFIG: Record<
  EstadoPrestamo,
  { tone: 'disponible' | 'reservado' | 'mantenimiento' | 'warning'; icon: React.ReactNode }
> = {
  PENDIENTE: {
    tone: 'warning',
    icon: <Clock className="h-3.5 w-3.5" aria-hidden />,
  },
  ENTREGADO: {
    tone: 'mantenimiento',
    icon: <PackageOpen className="h-3.5 w-3.5" aria-hidden />,
  },
  DEVUELTO: {
    tone: 'disponible',
    icon: <PackageCheck className="h-3.5 w-3.5" aria-hidden />,
  },
  NO_RECLAMADO: {
    tone: 'reservado',
    icon: <UserX className="h-3.5 w-3.5" aria-hidden />,
  },
};

/**
 * The loan state as a colour and an icon, so the desk can be read at a
 * glance. Colour alone is never the carrier — each state also has a distinct
 * icon and its own label, which is what makes it work for colour-blind users
 * and in the mobile card layout.
 */
export function PrestamoBadge({ estado }: { estado: EstadoPrestamo }) {
  const { t } = useTranslation();
  const cfg = CONFIG[estado] ?? CONFIG.PENDIENTE;
  return (
    <Badge tone={cfg.tone} icon={cfg.icon}>
      {t(`statusPrestamo.${estado}`)}
    </Badge>
  );
}
