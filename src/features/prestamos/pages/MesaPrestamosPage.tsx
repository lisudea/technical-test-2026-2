import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlarmClock,
  Clock,
  PackageCheck,
  PackageOpen,
  UserX,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { StatCard } from '@/components/ui/StatCard';
import { Table, type Column } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { PrestamoBadge } from '@/features/prestamos/components/PrestamoBadge';
import { PrestamoActionModal, type AccionPrestamo } from '@/features/prestamos/components/PrestamoActionModal';
import {
  useAgenda,
  useResumenPrestamos,
} from '@/features/prestamos/hooks/usePrestamos';
import type { Reserva } from '@/lib/types';

/** ISO date (yyyy-MM-dd) for today in the user's local calendar. */
function hoyIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function formatoHora(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * The auxiliar's console.
 *
 * <p>Laid out as a queue rather than a CRUD table, because that is the job:
 * somebody is standing at the counter and the auxiliar needs the next action
 * within one click. Which actions are offered is derived from the loan state,
 * so an illegal transition is never even presented — the backend refuses it
 * too, but a button that always fails is a bad button.
 */
export function MesaPrestamosPage() {
  const { t } = useTranslation();
  const toast = useToast();

  const [fecha, setFecha] = useState(hoyIso());
  const [estadoPrestamo, setEstadoPrestamo] = useState('');
  const [page, setPage] = useState(0);
  const [accion, setAccion] = useState<{ tipo: AccionPrestamo; reserva: Reserva } | null>(null);

  const agenda = useAgenda({ fecha, estadoPrestamo, page, size: 20 });
  const resumen = useResumenPrestamos(fecha);

  const ahora = useMemo(() => Date.now(), [agenda.dataUpdatedAt]);

  const estadoOptions = [
    { value: '', label: t('statusPrestamo.all') },
    { value: 'PENDIENTE', label: t('statusPrestamo.PENDIENTE') },
    { value: 'ENTREGADO', label: t('statusPrestamo.ENTREGADO') },
    { value: 'DEVUELTO', label: t('statusPrestamo.DEVUELTO') },
    { value: 'NO_RECLAMADO', label: t('statusPrestamo.NO_RECLAMADO') },
  ];

  const columns: Column<Reserva>[] = [
    {
      key: 'usuario',
      header: t('prestamos.user'),
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{r.usuarioNombre}</p>
          <p className="truncate text-xs text-ink-muted">{r.correoUsuario}</p>
        </div>
      ),
    },
    {
      key: 'equipo',
      header: t('prestamos.equipment'),
      render: (r) => <span className="font-medium text-ink">{r.equipoNombre}</span>,
    },
    {
      key: 'franja',
      header: t('prestamos.slot'),
      render: (r) => (
        <div className="whitespace-nowrap">
          <span className="tabular-nums">
            {formatoHora(r.fechaHoraInicio)} – {formatoHora(r.fechaHoraFin)}
          </span>
          {estaVencido(r, ahora) && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-state-reservado/10 px-1.5 py-0.5 text-xs font-semibold text-state-reservado">
              <AlarmClock className="h-3 w-3" aria-hidden />
              {t('prestamos.overdueBadge')}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'estado',
      header: t('prestamos.state'),
      render: (r) => <PrestamoBadge estado={r.estadoPrestamo} />,
    },
    {
      key: 'acciones',
      header: t('prestamos.actions'),
      className: 'text-right',
      render: (r) => (
        <div className="flex flex-wrap justify-end gap-2">
          {r.estadoPrestamo === 'PENDIENTE' && (
            <>
              <Button
                size="sm"
                onClick={() => setAccion({ tipo: 'entregar', reserva: r })}
                iconLeft={<PackageOpen className="h-4 w-4" aria-hidden />}
              >
                {t('prestamos.entregar.action')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAccion({ tipo: 'noReclamado', reserva: r })}
                iconLeft={<UserX className="h-4 w-4" aria-hidden />}
              >
                {t('prestamos.noReclamado.action')}
              </Button>
            </>
          )}
          {r.estadoPrestamo === 'ENTREGADO' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setAccion({ tipo: 'devolver', reserva: r })}
              iconLeft={<PackageCheck className="h-4 w-4" aria-hidden />}
            >
              {t('prestamos.devolver.action')}
            </Button>
          )}
          {/* DEVUELTO and NO_RECLAMADO are terminal: nothing left to offer. */}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">{t('prestamos.title')}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t('prestamos.subtitle')}</p>
      </header>

      {resumen.data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard
            label={t('prestamos.kpi.pendientes')}
            value={resumen.data.pendientes}
            tone="warning"
            icon={<Clock className="h-5 w-5" aria-hidden />}
          />
          <StatCard
            label={t('prestamos.kpi.entregados')}
            value={resumen.data.entregados}
            tone="mantenimiento"
            icon={<PackageOpen className="h-5 w-5" aria-hidden />}
          />
          <StatCard
            label={t('prestamos.kpi.devueltos')}
            value={resumen.data.devueltos}
            tone="disponible"
            icon={<PackageCheck className="h-5 w-5" aria-hidden />}
          />
          <StatCard
            label={t('prestamos.kpi.noReclamados')}
            value={resumen.data.noReclamados}
            tone="reservado"
            icon={<UserX className="h-5 w-5" aria-hidden />}
          />
          <StatCard
            label={t('prestamos.kpi.vencidos')}
            value={resumen.data.vencidos}
            tone="reservado"
            icon={<AlarmClock className="h-5 w-5" aria-hidden />}
          />
        </div>
      )}

      <Card>
        <div className="mb-4 grid gap-3 sm:grid-cols-[auto,1fr,auto] sm:items-end">
          <Input
            type="date"
            label={t('prestamos.date')}
            value={fecha}
            onChange={(e) => {
              setFecha(e.target.value);
              setPage(0);
            }}
          />
          <Select
            label={t('statusPrestamo.label')}
            options={estadoOptions}
            value={estadoPrestamo}
            onChange={(e) => {
              setEstadoPrestamo(e.target.value);
              setPage(0);
            }}
          />
          <Button
            variant="outline"
            onClick={() => {
              setFecha(hoyIso());
              setPage(0);
            }}
          >
            {t('prestamos.today')}
          </Button>
        </div>

        {agenda.isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner label={t('common.loading')} />
          </div>
        ) : agenda.isError ? (
          <ErrorState
            message={t('prestamos.actionError')}
            onRetry={() => void agenda.refetch()}
          />
        ) : (
          <>
            <Table
              columns={columns}
              data={agenda.data?.content ?? []}
              rowKey={(r) => r.idReserva}
              empty={
                <EmptyState
                  icon={<PackageOpen className="h-8 w-8 text-ink-muted" aria-hidden />}
                  title={t('prestamos.empty')}
                  description={t('prestamos.emptyDetail')}
                />
              }
            />
            {(agenda.data?.totalPages ?? 0) > 1 && (
              <Pagination
                className="mt-4"
                page={agenda.data?.number ?? 0}
                totalPages={agenda.data?.totalPages ?? 0}
                onChange={setPage}
              />
            )}
          </>
        )}
      </Card>

      {accion && (
        <PrestamoActionModal
          accion={accion.tipo}
          reserva={accion.reserva}
          onClose={() => setAccion(null)}
          onDone={(mensaje) => {
            toast.success(mensaje);
            setAccion(null);
          }}
        />
      )}
    </div>
  );
}

/** Handed over, past its end time, still not back. */
function estaVencido(reserva: Reserva, ahora: number): boolean {
  return (
    reserva.estadoPrestamo === 'ENTREGADO' &&
    new Date(reserva.fechaHoraFin).getTime() < ahora
  );
}
