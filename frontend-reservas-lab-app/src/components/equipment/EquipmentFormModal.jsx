import { useEffect, useState } from 'react'
import { Modal, ConfirmDialog } from '../ui/Modal.jsx'
import { Button } from '../ui/Button.jsx'
import { Field, Input, Select } from '../ui/Form.jsx'
import { Alert } from '../ui/Alert.jsx'
import { useToast, messageFromError } from '../ui/Toast.jsx'
import { EQUIPMENT_STATUS_VALUES } from '../../models/enums.js'

/**
 * Modal de alta/edicion de equipos (solo administrador) y confirmacion de baja.
 * `onSave(payload)` decide crear o actualizar contra el backend.
 */
export function EquipmentFormModal({ open, onClose, equipment, categories, onSave }) {
  const toast = useToast()

  const isEdit = Boolean(equipment)
  const [busy, setBusy] = useState(false)

  const [form, setForm] = useState({
    equipmentName: '',
    macNumber: '',
    status: EQUIPMENT_STATUS_VALUES[0],
    categoryId: categories?.[0]?.categoryId ?? '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    if (open) {
      setFormError(null)
      setFieldErrors({})
      if (equipment) {
        setForm({
          equipmentName: equipment.equipmentName,
          macNumber: equipment.macNumber,
          status: equipment.status,
          categoryId: equipment.categoryId ?? '',
        })
      } else {
        setForm({
          equipmentName: '',
          macNumber: '',
          status: EQUIPMENT_STATUS_VALUES[0],
          categoryId: categories?.[0]?.categoryId ?? '',
        })
      }
    }
  }, [open, equipment, categories])

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setFieldErrors((errs) => ({ ...errs, [field]: undefined }))
    setFormError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = {}
    if (!form.equipmentName.trim()) errors.equipmentName = 'El nombre es obligatorio'
    if (!form.macNumber.trim()) errors.macNumber = 'El numero de serie o MAC es obligatorio'
    if (!form.categoryId) errors.categoryId = 'Selecciona una categoria'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setFormError(null)
    setBusy(true)
    try {
      const payload = {
        equipmentName: form.equipmentName.trim(),
        macNumber: form.macNumber.trim(),
        status: form.status,
        categoryId: Number(form.categoryId),
      }
      await onSave(payload, isEdit)
      toast.success(isEdit ? 'Equipo actualizado correctamente.' : 'Equipo registrado correctamente.')
      onClose()
    } catch (err) {
      setFormError(messageFromError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar equipo' : 'Registrar equipo'}
      subtitle={
        isEdit
          ? `Actualizando la informacion de ${equipment.equipmentName}`
          : 'Agrega un nuevo equipo al inventario del laboratorio'
      }
      size="md"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button type="submit" form="equipment-form" loading={busy} icon={isEdit ? 'pencil' : 'plus'}>
            {isEdit ? 'Guardar cambios' : 'Registrar equipo'}
          </Button>
        </>
      }
    >
      {formError ? (
        <Alert tone="error" className="mb-4" title="No se pudo guardar el equipo">
          {formError}
        </Alert>
      ) : null}

      <form id="equipment-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Nombre del equipo" required error={fieldErrors.equipmentName}>
          <Input
            placeholder="Ej. Osciloscopio Rigol DS-1000Z"
            value={form.equipmentName}
            onChange={set('equipmentName')}
            invalid={Boolean(fieldErrors.equipmentName)}
          />
        </Field>

        <Field
          label="Numero de serie o MAC"
          required
          error={fieldErrors.macNumber}
          hint="Identificacion unica del equipo."
        >
          <Input
            placeholder="SER-0001 o AA:BB:CC:DD:EE:FF"
            value={form.macNumber}
            onChange={set('macNumber')}
            invalid={Boolean(fieldErrors.macNumber)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Estado" required>
            <Select value={form.status} onChange={set('status')}>
              {EQUIPMENT_STATUS_VALUES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Categoria" required error={fieldErrors.categoryId}>
            <Select
              value={form.categoryId}
              onChange={set('categoryId')}
              invalid={Boolean(fieldErrors.categoryId)}
            >
              <option value="">Selecciona...</option>
              {categories?.map((c) => (
                <option key={c.categoryId} value={c.categoryId}>
                  {c.categoryName}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </form>
    </Modal>
  )
}

export function DeleteEquipmentDialog({ open, equipment, onCancel, onConfirm, busy }) {
  return (
    <ConfirmDialog
      open={open}
      onCancel={onCancel}
      onConfirm={onConfirm}
      busy={busy}
      title="Eliminar equipo"
      confirmLabel="Eliminar"
      message={
        <>
          ¿Seguro que deseas eliminar{' '}
          <span className="font-semibold text-ink">{equipment?.equipmentName}</span> del inventario?
          El backend rechazara la operacion si el equipo tiene reservas activas.
        </>
      }
    />
  )
}