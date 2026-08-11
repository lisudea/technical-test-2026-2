import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useCrearSancion } from '@/features/sanciones/hooks/useSanciones';
import { errorMessage } from '@/lib/api';
import type { Usuario } from '@/lib/types';

interface SancionFormModalProps {
  usuario: Usuario;
  onClose: () => void;
  onDone: (mensaje: string) => void;
}

/**
 * Raise a sanction against a specific user.
 *
 * <p>The duration is entered in whole days, matching how the decision is
 * actually made ("a week off"), and the resulting end date is previewed
 * before confirming — a number of days is easy to mistype and hard to
 * picture, a date is not.
 *
 * <p>The user is fixed by the caller rather than chosen here: sanctioning is
 * always reached from a row that already identifies the person, and a
 * free-floating user picker is how you sanction the wrong Maria.
 */
export function SancionFormModal({ usuario, onClose, onDone }: SancionFormModalProps) {
  const { t } = useTranslation();

  const [motivo, setMotivo] = useState('');
  const [dias, setDias] = useState(7);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const crear = useCrearSancion();

  const fechaFin = new Date(Date.now() + dias * 86_400_000);

  async function handleSubmit() {
    setError(null);
    if (!motivo.trim()) {
      setErrores({ motivo: t('sanciones.reasonRequired') });
      return;
    }
    setErrores({});

    try {
      await crear.mutateAsync({
        idUsuario: usuario.idUsuario,
        motivo: motivo.trim(),
        dias,
      });
      onDone(t('sanciones.createSuccess'));
    } catch (err) {
      // The backend refuses stacking with a message naming the existing
      // sanction's end date — worth showing verbatim.
      setError(errorMessage(err, t('sanciones.createError')));
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={t('sanciones.createTitle')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={crear.isPending}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="danger"
            loading={crear.isPending}
            onClick={() => void handleSubmit()}
          >
            {t('common.confirm')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-xl bg-surface p-3 text-sm">
          <p className="font-medium text-ink">{usuario.nombre}</p>
          <p className="text-ink-muted">{usuario.correo}</p>
        </div>

        <Input
          label={t('sanciones.reason')}
          placeholder={t('sanciones.reasonPlaceholder')}
          value={motivo}
          error={errores.motivo}
          maxLength={255}
          onChange={(e) => setMotivo(e.target.value)}
        />

        <Input
          type="number"
          min={1}
          max={365}
          label={t('sanciones.days')}
          hint={`${t('sanciones.daysHint')} · ${t('sanciones.until')} ${fechaFin.toLocaleDateString()}`}
          value={dias}
          onChange={(e) => setDias(Math.min(365, Math.max(1, Number(e.target.value) || 1)))}
        />

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
