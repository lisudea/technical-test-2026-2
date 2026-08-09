import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Cpu, Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge, statusHintKey } from '@/features/equipos/components/StatusBadge';
import type { Equipo } from '@/lib/types';

interface EquipoCardProps {
  equipo: Equipo;
}

export function EquipoCard({ equipo }: EquipoCardProps) {
  const { t } = useTranslation();
  const disponible = equipo.estado === 'DISPONIBLE';

  return (
    <Card as="article" interactive className="flex h-full flex-col">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-ink">{equipo.nombre}</h3>
          <Badge tone="neutral" className="mt-1.5">
            <Cpu className="h-3.5 w-3.5" aria-hidden />
            {equipo.categoriaNombre}
          </Badge>
        </div>
        <StatusBadge estado={equipo.estado} />
      </div>

      <p className="mb-4 line-clamp-2 min-h-[2.5rem] text-sm text-ink-soft">
        {equipo.descripcion || t('equipos.noUpcoming')}
      </p>

      <dl className="mb-4 mt-auto grid grid-cols-1 gap-1 text-xs text-ink-muted">
        <div className="flex items-center gap-1.5">
          <dt className="font-medium text-ink-soft">{t('equipos.serial')}:</dt>
          <dd className="truncate font-mono">{equipo.numeroSerie || '—'}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="font-medium text-ink-soft">{t('equipos.mac')}:</dt>
          <dd className="truncate font-mono">{equipo.macAddress || '—'}</dd>
        </div>
      </dl>

      <div className="flex items-center gap-2">
        <Link to={`/equipos/${equipo.idEquipo}`} className="flex-1">
          <Button variant="secondary" size="sm" className="w-full" iconRight={<ArrowRight className="h-4 w-4" aria-hidden />}>
            {t('equipos.viewDetail')}
          </Button>
        </Link>
        {disponible ? (
          <Link to={`/equipos/${equipo.idEquipo}?reservar=1`}>
            <Button variant="primary" size="sm">
              {t('equipos.reserve')}
            </Button>
          </Link>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            disabled
            title={t(statusHintKey(equipo.estado))}
            iconLeft={<Lock className="h-4 w-4" aria-hidden />}
          >
            {t('equipos.reserve')}
          </Button>
        )}
      </div>
    </Card>
  );
}
