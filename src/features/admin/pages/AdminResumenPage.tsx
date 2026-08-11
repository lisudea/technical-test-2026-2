import { useTranslation } from 'react-i18next';
import {
  AlarmClock,
  Ban,
  Boxes,
  CalendarClock,
  CheckCircle2,
  CircleSlash,
  Clock,
  PlayCircle,
  ShieldCheck,
  UserCog,
  Users,
  Wrench,
} from 'lucide-react';
import { ErrorState } from '@/components/ui/ErrorState';
import { Spinner } from '@/components/ui/Spinner';
import { StatCard } from '@/components/ui/StatCard';
import { useResumenAdmin } from '@/features/admin/hooks/useAdmin';

/**
 * The lab at a glance.
 *
 * <p>Grouped by the question each block answers — what do we own, what is
 * booked, what is at the counter, who are we — instead of one undifferentiated
 * grid of twelve numbers, which reads as noise.
 */
export function AdminResumenPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useResumenAdmin();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner label={t('common.loading')} />
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState message={t('common.retry')} onRetry={() => void refetch()} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          {t('admin.tabs.equipos')}
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label={t('admin.kpi.equipos')}
            value={data.totalEquipos}
            icon={<Boxes className="h-5 w-5" aria-hidden />}
          />
          <StatCard
            label={t('admin.kpi.disponibles')}
            value={data.equiposDisponibles}
            tone="disponible"
            icon={<CheckCircle2 className="h-5 w-5" aria-hidden />}
          />
          <StatCard
            label={t('admin.kpi.mantenimiento')}
            value={data.equiposMantenimiento}
            tone="mantenimiento"
            icon={<Wrench className="h-5 w-5" aria-hidden />}
          />
          <StatCard
            label={t('admin.kpi.baja')}
            value={data.equiposBaja}
            tone="reservado"
            icon={<CircleSlash className="h-5 w-5" aria-hidden />}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          {t('nav.auxiliar')}
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label={t('admin.kpi.reservasActivas')}
            value={data.reservasActivas}
            icon={<CalendarClock className="h-5 w-5" aria-hidden />}
          />
          <StatCard
            label={t('admin.kpi.reservasEnCurso')}
            value={data.reservasEnCurso}
            tone="disponible"
            icon={<PlayCircle className="h-5 w-5" aria-hidden />}
          />
          <StatCard
            label={t('admin.kpi.prestamosPendientes')}
            value={data.prestamosPendientes}
            tone="warning"
            icon={<Clock className="h-5 w-5" aria-hidden />}
          />
          {/* Overdue equipment is the one number that means "act now". */}
          <StatCard
            label={t('admin.kpi.prestamosVencidos')}
            value={data.prestamosVencidos}
            tone={data.prestamosVencidos > 0 ? 'reservado' : 'neutral'}
            icon={<AlarmClock className="h-5 w-5" aria-hidden />}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          {t('admin.tabs.usuarios')}
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label={t('admin.kpi.usuarios')}
            value={data.totalUsuarios}
            icon={<Users className="h-5 w-5" aria-hidden />}
          />
          <StatCard
            label={t('admin.kpi.auxiliares')}
            value={data.totalAuxiliares}
            icon={<UserCog className="h-5 w-5" aria-hidden />}
          />
          <StatCard
            label={t('admin.kpi.admins')}
            value={data.totalAdmins}
            icon={<ShieldCheck className="h-5 w-5" aria-hidden />}
          />
          <StatCard
            label={t('admin.kpi.sancionesVigentes')}
            value={data.sancionesVigentes}
            tone={data.sancionesVigentes > 0 ? 'warning' : 'neutral'}
            icon={<Ban className="h-5 w-5" aria-hidden />}
          />
        </div>
      </section>
    </div>
  );
}
