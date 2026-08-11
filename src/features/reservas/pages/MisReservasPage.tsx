import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Ban, CalendarX2, Trash2 } from 'lucide-react';
import { useReservas, useCancelarReserva } from '@/features/reservas/hooks/useReservas';
import { useAuth } from '@/features/auth/AuthContext';
import { useMisSanciones } from '@/features/sanciones/hooks/useSanciones';
import { Table, type Column } from '@/components/ui/Table';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useToast } from '@/components/ui/Toast';
import { errorMessage } from '@/lib/api';
import type { EstadoReserva, Reserva } from '@/lib/types';

const RESERVA_TONE: Record<EstadoReserva, 'disponible' | 'reservado' | 'mantenimiento' | 'neutral'> = {
  ACTIVA: 'disponible',
  CANCELADA: 'neutral',
  COMPLETADA: 'mantenimiento',
};

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(value)
    );
  } catch {
    return value;
  }
}

export function MisReservasPage() {
  const { t } = useTranslation();
  const { perfil } = useAuth();
  const toast = useToast();
  const cancelar = useCancelarReserva();
  const [toCancel, setToCancel] = useState<Reserva | null>(null);

  const filters = useMemo(
    () => ({ correo: perfil?.correo, page: 0, size: 50 }),
    [perfil?.correo]
  );
  const reservasQuery = useReservas(filters);
  const reservas = reservasQuery.data?.content ?? [];

  // A sanctioned user gets a 403 the moment they try to book. Telling them
  // here — with the reason and the end date — beats letting them build a
  // reservation and hit a wall at submit.
  const sanciones = useMisSanciones(Boolean(perfil));
  const sancionVigente = sanciones.data?.find((s) => s.vigente) ?? null;

  const columns: Column<Reserva>[] = [
    {
      key: 'equipoNombre',
      header: t('reservas.equipment'),
      render: (r) => <span className="font-medium text-ink">{r.equipoNombre}</span>,
    },
    {
      key: 'fechaHoraInicio',
      header: t('reservas.start'),
      render: (r) => formatDate(r.fechaHoraInicio),
    },
    {
      key: 'fechaHoraFin',
      header: t('reservas.end'),
      render: (r) => formatDate(r.fechaHoraFin),
      hideOnMobile: true,
    },
    {
      key: 'motivo',
      header: t('reservas.reason'),
      render: (r) => <span className="line-clamp-1 max-w-[16rem]">{r.motivo}</span>,
      hideOnMobile: true,
    },
    {
      key: 'estado',
      header: t('reservas.status'),
      render: (r) => (
        <Badge tone={RESERVA_TONE[r.estado]}>{t(`status.${r.estado}`)}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (r) =>
        r.estado === 'ACTIVA' ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setToCancel(r)}
            iconLeft={<Trash2 className="h-4 w-4 text-state-reservado" aria-hidden />}
          >
            {t('reservas.cancel')}
          </Button>
        ) : (
          <span className="text-ink-muted">—</span>
        ),
    },
  ];

  async function confirmCancel() {
    if (!toCancel) return;
    try {
      await cancelar.mutateAsync(toCancel.idReserva);
      toast.success(t('reservas.cancelSuccess'));
      setToCancel(null);
    } catch (err) {
      toast.error(errorMessage(err, t('reservas.cancelError')));
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <header>
        <h1 className="text-2xl font-bold text-ink">{t('reservas.title')}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t('reservas.subtitle')}</p>
      </header>

      {sancionVigente && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-state-reservado/25 bg-state-reservado/5 p-4"
        >
          <Ban className="mt-0.5 h-5 w-5 shrink-0 text-state-reservado" aria-hidden />
          <div className="text-sm">
            <p className="font-semibold text-state-reservado">
              {t('sanciones.myActive', {
                fecha: formatDate(sancionVigente.fechaFin),
              })}
            </p>
            <p className="mt-0.5 text-ink-soft">
              {t('sanciones.reason')}: {sancionVigente.motivo}
            </p>
          </div>
        </div>
      )}

      <Card className="p-4 sm:p-5">
        {reservasQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner label={t('common.loading')} />
          </div>
        ) : reservasQuery.isError ? (
          <ErrorState
            message={t('auth.networkError')}
            onRetry={() => reservasQuery.refetch()}
          />
        ) : reservas.length === 0 ? (
          <EmptyState
            title={t('reservas.noReservations')}
            description={t('reservas.noReservationsDetail')}
            icon={<CalendarX2 className="h-7 w-7" aria-hidden />}
          />
        ) : (
          <Table
            columns={columns}
            data={reservas}
            rowKey={(r) => r.idReserva}
          />
        )}
      </Card>

      <Modal
        open={toCancel !== null}
        onClose={() => setToCancel(null)}
        title={t('reservas.cancel')}
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setToCancel(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              size="md"
              loading={cancelar.isPending}
              onClick={confirmCancel}
            >
              {t('common.confirm')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">
          {t('reservas.cancelConfirm')}
        </p>
        {toCancel && (
          <p className="mt-3 rounded-xl bg-surface px-3 py-2 text-sm text-ink">
            <span className="font-semibold">{toCancel.equipoNombre}</span>
            <br />
            {formatDate(toCancel.fechaHoraInicio)} — {formatDate(toCancel.fechaHoraFin)}
          </p>
        )}
      </Modal>
    </div>
  );
}
