import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import {
  useDevolver,
  useEntregar,
  useMarcarNoReclamado,
} from '@/features/prestamos/hooks/usePrestamos';
import { errorMessage } from '@/lib/api';
import type { Reserva } from '@/lib/types';

export type AccionPrestamo = 'entregar' | 'devolver' | 'noReclamado';

interface PrestamoActionModalProps {
  accion: AccionPrestamo;
  reserva: Reserva;
  onClose: () => void;
  onDone: (mensaje: string) => void;
}

/**
 * One modal for the three desk actions.
 *
 * <p>They share a shape — a note, an optional consequence checkbox, a
 * confirm — so three near-identical components would have been three places
 * to fix the next time the flow changes. What differs is declared in the
 * copy and the single checkbox each one shows.
 *
 * <p>Backend refusals (handing over too early, declaring a no-show before
 * the grace period) surface inline rather than as a toast: the message
 * explains a rule and names a time, and the user needs it next to the button
 * that just failed, not floating in a corner for four seconds.
 */
export function PrestamoActionModal({
  accion,
  reserva,
  onClose,
  onDone,
}: PrestamoActionModalProps) {
  const { t } = useTranslation();
  const toast = useToast();

  const [observaciones, setObservaciones] = useState('');
  const [marcaExtra, setMarcaExtra] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entregar = useEntregar();
  const devolver = useDevolver();
  const noReclamado = useMarcarNoReclamado();

  const mutation =
    accion === 'entregar' ? entregar : accion === 'devolver' ? devolver : noReclamado;

  async function handleSubmit() {
    setError(null);
    try {
      await mutation.mutateAsync({
        idReserva: reserva.idReserva,
        observaciones: observaciones.trim() || undefined,
        ...(accion === 'devolver' ? { requiereMantenimiento: marcaExtra } : {}),
        ...(accion === 'noReclamado' ? { sancionar: marcaExtra } : {}),
      });
      onDone(t(`prestamos.${accion}.success`));
    } catch (err) {
      const msg = errorMessage(err, t('prestamos.actionError'));
      setError(msg);
      toast.error(msg);
    }
  }

  const titulo =
    accion === 'noReclamado'
      ? t('prestamos.noReclamado.title')
      : t(`prestamos.${accion}.title`, { equipo: reserva.equipoNombre });

  return (
    <Modal
      open
      onClose={onClose}
      title={titulo}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            {t('common.cancel')}
          </Button>
          <Button
            variant={accion === 'noReclamado' ? 'danger' : 'primary'}
            loading={mutation.isPending}
            onClick={() => void handleSubmit()}
          >
            {t(`prestamos.${accion}.submit`)}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink-muted">{t(`prestamos.${accion}.hint`)}</p>

        <div className="rounded-xl bg-surface p-3 text-sm">
          <p className="font-medium text-ink">{reserva.equipoNombre}</p>
          <p className="text-ink-muted">
            {reserva.usuarioNombre} · {reserva.correoUsuario}
          </p>
        </div>

        <Input
          label={t(`prestamos.${accion}.notes`)}
          placeholder={t(`prestamos.${accion}.notesPlaceholder`)}
          value={observaciones}
          maxLength={500}
          onChange={(e) => setObservaciones(e.target.value)}
        />

        {(accion === 'devolver' || accion === 'noReclamado') && (
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-surface-line p-3 transition-colors hover:border-primary/50">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-[#6CBCB9]"
              checked={marcaExtra}
              onChange={(e) => setMarcaExtra(e.target.checked)}
            />
            <span className="text-sm">
              <span className="font-medium text-ink">
                {accion === 'devolver'
                  ? t('prestamos.devolver.maintenance')
                  : t('prestamos.noReclamado.sanction')}
              </span>
              <span className="block text-xs text-ink-muted">
                {accion === 'devolver'
                  ? t('prestamos.devolver.maintenanceHint')
                  : t('prestamos.noReclamado.sanctionHint')}
              </span>
            </span>
          </label>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-state-reservado/25 bg-state-reservado/5 p-3 text-sm text-state-reservado">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
