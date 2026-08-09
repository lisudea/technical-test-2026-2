import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  CalendarPlus,
  Cpu,
  Hash,
  Wifi,
  CalendarDays,
  Lock,
} from 'lucide-react';
import { useEquipo } from '@/features/equipos/hooks/useEquipos';
import { useReservasPorEquipo } from '@/features/reservas/hooks/useReservas';
import { StatusBadge, statusHintKey } from '@/features/equipos/components/StatusBadge';
import { ReservationForm } from '@/features/reservas/components/ReservationForm';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/features/auth/AuthContext';
import type { Reserva } from '@/lib/types';

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-surface-line py-3 last:border-0">
      <dt className="flex items-center gap-2 text-sm font-medium text-ink-muted">
        {icon}
        {label}
      </dt>
      <dd className="text-right text-sm text-ink">{value || '—'}</dd>
    </div>
  );
}

export function EquipoDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const equipoId = id ? Number(id) : undefined;

  const equipoQuery = useEquipo(equipoId);
  const reservasQuery = useReservasPorEquipo(equipoId);
  const [formOpen, setFormOpen] = useState(false);

  // Auto-open the reservation modal when arriving via ?reservar=1
  useEffect(() => {
    if (params.get('reservar') === '1' && equipoQuery.data?.estado === 'DISPONIBLE') {
      setFormOpen(true);
      const next = new URLSearchParams(params);
      next.delete('reservar');
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, equipoQuery.data]);

  if (equipoQuery.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner label={t('common.loading')} />
      </div>
    );
  }

  if (equipoQuery.isError || !equipoQuery.data) {
    return (
      <div className="flex flex-col gap-4">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-primary-dark hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t('common.back')}
        </Link>
        <EmptyState title={t('equipos.notFound')} description={t('equipos.notFoundDetail')} />
      </div>
    );
  }

  const equipo = equipoQuery.data;
  const disponible = equipo.estado === 'DISPONIBLE';
  const reservas = reservasQuery.data ?? [];

  function handleReservar() {
    if (!isAuthenticated) {
      navigate(`/login?from=${encodeURIComponent(`/equipos/${equipo!.idEquipo}?reservar=1`)}`);
      return;
    }
    setFormOpen(true);
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Link to="/" className="inline-flex w-fit items-center gap-1.5 text-sm text-primary-dark hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t('common.back')}
      </Link>

      {/* Hero */}
      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-dark">
            <Cpu className="h-7 w-7" aria-hidden />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink sm:text-2xl">{equipo.nombre}</h1>
            <div className="mt-2 flex items-center gap-2">
              <StatusBadge estado={equipo.estado} />
              <Badge tone="neutral">{equipo.categoriaNombre}</Badge>
            </div>
          </div>
        </div>
        {disponible ? (
          <Button
            variant="primary"
            size="lg"
            onClick={handleReservar}
            iconLeft={<CalendarPlus className="h-5 w-5" aria-hidden />}
            className="w-full sm:w-auto"
          >
            {t('equipos.reserve')}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="lg"
            disabled
            title={t(statusHintKey(equipo.estado))}
            iconLeft={<Lock className="h-5 w-5" aria-hidden />}
            className="w-full sm:w-auto"
          >
            {t('equipos.reserve')}
          </Button>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Info */}
        <Card>
          <h2 className="mb-2 text-base font-semibold text-ink">{t('equipos.description')}</h2>
          <p className="mb-4 text-sm text-ink-soft">{equipo.descripcion || '—'}</p>
          <dl>
            <DetailRow
              icon={<Cpu className="h-4 w-4 text-primary" aria-hidden />}
              label={t('equipos.categoryLabel')}
              value={equipo.categoriaNombre}
            />
            <DetailRow
              icon={<Hash className="h-4 w-4 text-primary" aria-hidden />}
              label={t('equipos.serial')}
              value={<span className="font-mono">{equipo.numeroSerie}</span>}
            />
            <DetailRow
              icon={<Wifi className="h-4 w-4 text-primary" aria-hidden />}
              label={t('equipos.mac')}
              value={<span className="font-mono">{equipo.macAddress}</span>}
            />
            <DetailRow
              icon={<CalendarDays className="h-4 w-4 text-primary" aria-hidden />}
              label={t('equipos.created', { date: formatDate(equipo.fechaCreacion) })}
              value={formatDate(equipo.fechaActualizacion)}
            />
          </dl>
        </Card>

        {/* Upcoming reservations */}
        <Card>
          <h2 className="mb-3 text-base font-semibold text-ink">
            {t('equipos.upcomingReservations')}
          </h2>
          {reservasQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : reservasQuery.isError ? (
            <ErrorState
              message={t('auth.networkError')}
              onRetry={() => reservasQuery.refetch()}
            />
          ) : reservas.length === 0 ? (
            <EmptyState title={t('equipos.noUpcoming')} />
          ) : (
            <ul className="flex flex-col gap-2">
              {reservas.map((r: Reserva) => (
                <li
                  key={r.idReserva}
                  className="flex items-center justify-between gap-3 rounded-xl border border-surface-line bg-surface px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {r.usuarioNombre}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {formatDate(r.fechaHoraInicio)} — {formatDate(r.fechaHoraFin)}
                    </p>
                  </div>
                  <Badge tone="disponible">{t('status.ACTIVA')}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <ReservationForm equipo={equipo} open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
