import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { CalendarPlus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { errorMessage } from '@/lib/api';
import { useCrearReserva } from '@/features/reservas/hooks/useReservas';
import { useAuth } from '@/features/auth/AuthContext';
import type { Equipo } from '@/lib/types';

interface ReservationFormProps {
  equipo: Equipo;
  open: boolean;
  onClose: () => void;
}

function buildSchema(t: (k: string, o?: Record<string, unknown>) => string) {
  return z
    .object({
      fechaHoraInicio: z.string().min(1, t('reservas.form.startRequired')),
      fechaHoraFin: z.string().min(1, t('reservas.form.endRequired')),
      motivo: z
        .string()
        .min(3, t('reservas.form.reasonRequired'))
        .max(280, t('reservas.form.reasonRequired')),
    })
    .refine((d) => new Date(d.fechaHoraFin) > new Date(d.fechaHoraInicio), {
      message: t('reservas.form.endAfterStart'),
      path: ['fechaHoraFin'],
    })
    .refine((d) => new Date(d.fechaHoraInicio) > new Date(), {
      message: t('reservas.form.startFuture'),
      path: ['fechaHoraInicio'],
    })
    .refine(
      (d) =>
        new Date(d.fechaHoraFin).getTime() - new Date(d.fechaHoraInicio).getTime() <=
        8 * 60 * 60 * 1000,
      { message: t('reservas.form.maxDuration'), path: ['fechaHoraFin'] }
    );
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

/** Convert a datetime-local value to an ISO string with the local offset. */
function toIsoWithOffset(local: string): string {
  const date = new Date(local);
  const pad = (n: number) => String(n).padStart(2, '0');
  const tzOffset = -date.getTimezoneOffset();
  const sign = tzOffset >= 0 ? '+' : '-';
  const off = Math.abs(tzOffset);
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00${sign}${pad(Math.floor(off / 60))}:${pad(off % 60)}`
  );
}

export function ReservationForm({ equipo, open, onClose }: ReservationFormProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const { perfil } = useAuth();
  const crear = useCrearReserva();

  const schema = buildSchema(t);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fechaHoraInicio: '', fechaHoraFin: '', motivo: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!perfil) {
      toast.error(t('auth.authError'));
      return;
    }
    try {
      await crear.mutateAsync({
        nombreUsuario: perfil.nombre,
        correoUsuario: perfil.correo,
        idEquipo: equipo.idEquipo,
        fechaHoraInicio: toIsoWithOffset(values.fechaHoraInicio),
        fechaHoraFin: toIsoWithOffset(values.fechaHoraFin),
        motivo: values.motivo,
      });
      toast.success(t('reservas.createSuccess'));
      reset();
      onClose();
    } catch (err) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr.response?.status === 409) {
        toast.error(t('reservas.conflict'));
      } else {
        toast.error(errorMessage(err, t('auth.authError')));
      }
    }
  });

  const disponible = equipo.estado === 'DISPONIBLE';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('reservas.form.title', { equipo: equipo.nombre })}
      footer={
        <>
          <Button variant="ghost" size="md" onClick={onClose} type="button">
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            form="reserva-form"
            variant="primary"
            size="md"
            loading={isSubmitting || crear.isPending}
            disabled={!disponible}
            iconLeft={<CalendarPlus className="h-4 w-4" aria-hidden />}
          >
            {isSubmitting || crear.isPending
              ? t('reservas.form.submitting')
              : t('reservas.form.submit')}
          </Button>
        </>
      }
    >
      {!disponible && (
        <p className="mb-4 rounded-lg border border-state-warning/30 bg-state-warning/5 p-2.5 text-xs text-state-warning">
          {t(`statusHint.${equipo.estado}`)}
        </p>
      )}
      <form id="reserva-form" onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          type="datetime-local"
          label={t('reservas.form.start')}
          error={errors.fechaHoraInicio?.message}
          {...register('fechaHoraInicio')}
        />
        <Input
          type="datetime-local"
          label={t('reservas.form.end')}
          error={errors.fechaHoraFin?.message}
          {...register('fechaHoraFin')}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="motivo" className="text-sm font-medium text-ink">
            {t('reservas.form.reason')}
          </label>
          <textarea
            id="motivo"
            rows={3}
            placeholder={t('reservas.form.reasonPlaceholder')}
            className="w-full rounded-xl border border-surface-line bg-surface-card px-3.5 py-2.5 text-sm text-ink shadow-sm transition-colors placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-surface"
            {...register('motivo')}
          />
          {errors.motivo?.message && (
            <p className="text-xs font-medium text-state-reservado">{errors.motivo.message}</p>
          )}
        </div>
      </form>
    </Modal>
  );
}
