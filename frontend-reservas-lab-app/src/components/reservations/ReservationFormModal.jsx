import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal.jsx'
import { Button } from '../ui/Button.jsx'
import { Field, Input } from '../ui/Form.jsx'
import { Alert } from '../ui/Alert.jsx'
import { StatusBadge } from '../ui/StatusBadge.jsx'
import { useReservationActions } from '../../hooks/useReservation.js'
import { useToast, messageFromError } from '../ui/Toast.jsx'
import {
  toBackendDateTime,
  formatLongDate,
  formatTime,
} from '../../utils/format.js'

const nowDatetimeISO = () => new Date().toISOString()

/**
 * Modal para crear una reserva de un equipo (POST /api/reservations).
 * El backend rechaza con 409 los horarios traslapados o equipos en mantenimiento.
 */
export function ReservationFormModal({ open, onClose, equipment, onCreated }) {
  const { create, submitting, lastError } = useReservationActions()
  const toast = useToast()

  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    if (open) {
      setStart('')
      setEnd('')
      setFieldErrors({})
      setFormError(null)
    }
  }, [open, equipment?.equipmentId])

  useEffect(() => {
    if (lastError) setFormError(messageFromError(lastError))
  }, [lastError])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = {}
    const now = nowDatetimeISO()

    if (!start) errors.start = 'Selecciona la fecha y hora de inicio'
    if (!end) errors.end = 'Selecciona la fecha y hora de finalizacion'
    if (start && end) {
      if (new Date(start).toISOString() >= new Date(end).toISOString()) {
        errors.end = 'La finalizacion debe ser posterior al inicio'
      }
    }
    if (start && new Date(start).toISOString() < now) {
      errors.start = 'El inicio debe ser en el futuro'
    }
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setFormError(null)
    try {
      await create({
        equipmentId: equipment.equipmentId,
        startTime: toBackendDateTime(start),
        endTime: toBackendDateTime(end),
      })
      toast.success('Reserva creada correctamente.')
      onCreated?.()
      onClose()
    } catch (err) {
      // El error ya se muestra via lastError/formError; evitar duplicado.
      if (!err?.message) setFormError(messageFromError(err))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reservar equipo"
      subtitle={equipment ? `Reserva para ${equipment.equipmentName}` : undefined}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" form="reservation-form" loading={submitting} icon="calendarPlus">
            Crear reserva
          </Button>
        </>
      }
    >
      {equipment ? (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-primary-50 px-4 py-3">
          <div>
            <p className="font-semibold text-primary-dark">{equipment.equipmentName}</p>
            <p className="text-xs text-muted">
              Serial/MAC: <span className="font-mono">{equipment.macNumber}</span> ·{' '}
              {equipment.categoryName}
            </p>
          </div>
          <StatusBadge status={equipment.status} variant="equipment" />
        </div>
      ) : null}

      {formError ? (
        <Alert
          tone="error"
          className="mb-4"
          title="No fue posible crear la reserva"
        >
          {formError}
        </Alert>
      ) : null}

      <form id="reservation-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field
          label="Inicio"
          required
          error={fieldErrors.start}
          hint="El equipo queda excluido de reservas simultaneas (no se permiten horarios traslapados)."
        >
          <Input
            type="datetime-local"
            value={start}
            onChange={(e) => {
              setStart(e.target.value)
              setFieldErrors((f) => ({ ...f, start: undefined }))
              setFormError(null)
            }}
            invalid={Boolean(fieldErrors.start)}
          />
        </Field>

        <Field label="Finalizacion" required error={fieldErrors.end}>
          <Input
            type="datetime-local"
            min={start}
            value={end}
            onChange={(e) => {
              setEnd(e.target.value)
              setFieldErrors((f) => ({ ...f, end: undefined }))
              setFormError(null)
            }}
            invalid={Boolean(fieldErrors.end)}
          />
        </Field>

        {start && end && new Date(end) > new Date(start) ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            Reserva del {formatLongDate(start)} desde las {formatTime(start)} hasta las{' '}
            {formatTime(end)}.
          </p>
        ) : null}
      </form>
    </Modal>
  )
}