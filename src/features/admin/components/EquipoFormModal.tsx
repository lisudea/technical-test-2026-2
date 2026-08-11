import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useActualizarEquipo, useCrearEquipo } from '@/features/admin/hooks/useAdmin';
import { errorMessage } from '@/lib/api';
import type { Categoria, Equipo, EquipoPayload } from '@/lib/types';

interface EquipoFormModalProps {
  /** null = create, an equipo = edit. */
  equipo: Equipo | null;
  categorias: Categoria[];
  onClose: () => void;
  onDone: (mensaje: string) => void;
}

/**
 * Create / edit form for a piece of equipment.
 *
 * <p>`estado` is deliberately absent. Creation always yields DISPONIBLE, and
 * changing the state is its own narrow endpoint that an auxiliar can also
 * reach — mixing it into the full update would mean an auxiliar had to be
 * granted full catalog rights just to send something to maintenance.
 */
export function EquipoFormModal({
  equipo,
  categorias,
  onClose,
  onDone,
}: EquipoFormModalProps) {
  const { t } = useTranslation();
  const esEdicion = equipo !== null;

  const [form, setForm] = useState<EquipoPayload>({
    nombre: equipo?.nombre ?? '',
    numeroSerie: equipo?.numeroSerie ?? '',
    macAddress: equipo?.macAddress ?? '',
    descripcion: equipo?.descripcion ?? '',
    idCategoria: equipo?.idCategoria ?? categorias[0]?.idCategoria ?? 0,
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const crear = useCrearEquipo();
  const actualizar = useActualizarEquipo();
  const mutation = esEdicion ? actualizar : crear;

  function validar(): boolean {
    const next: Record<string, string> = {};
    if (!form.nombre.trim()) next.nombre = t('admin.equipos.nameRequired');
    if (!form.idCategoria) next.idCategoria = t('admin.equipos.categoryRequired');
    setErrores(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    setError(null);
    if (!validar()) return;

    // Send optional empty strings as undefined: the backend treats a blank
    // serial as a real value, and an empty string would collide with the
    // UNIQUE index the second time somebody leaves it blank.
    const payload: EquipoPayload = {
      nombre: form.nombre.trim(),
      numeroSerie: form.numeroSerie?.trim() || undefined,
      macAddress: form.macAddress?.trim() || undefined,
      descripcion: form.descripcion?.trim() || undefined,
      idCategoria: Number(form.idCategoria),
    };

    try {
      if (esEdicion) {
        await actualizar.mutateAsync({ idEquipo: equipo.idEquipo, payload });
        onDone(t('admin.equipos.updateSuccess'));
      } else {
        await crear.mutateAsync(payload);
        onDone(t('admin.equipos.createSuccess'));
      }
    } catch (err) {
      setError(errorMessage(err, t('admin.equipos.saveError')));
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={esEdicion ? t('admin.equipos.edit') : t('admin.equipos.createTitle')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            {t('common.cancel')}
          </Button>
          <Button loading={mutation.isPending} onClick={() => void handleSubmit()}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label={t('admin.equipos.name')}
          value={form.nombre}
          error={errores.nombre}
          maxLength={150}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        />

        <Select
          label={t('admin.equipos.category')}
          error={errores.idCategoria}
          options={categorias.map((c) => ({ value: c.idCategoria, label: c.nombre }))}
          value={form.idCategoria}
          onChange={(e) => setForm({ ...form, idCategoria: Number(e.target.value) })}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('admin.equipos.serial')}
            value={form.numeroSerie ?? ''}
            maxLength={100}
            onChange={(e) => setForm({ ...form, numeroSerie: e.target.value })}
          />
          <Input
            label={t('admin.equipos.mac')}
            placeholder="AA:BB:CC:DD:EE:FF"
            value={form.macAddress ?? ''}
            maxLength={17}
            onChange={(e) => setForm({ ...form, macAddress: e.target.value })}
          />
        </div>

        <Input
          label={t('admin.equipos.description')}
          value={form.descripcion ?? ''}
          maxLength={2000}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
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
