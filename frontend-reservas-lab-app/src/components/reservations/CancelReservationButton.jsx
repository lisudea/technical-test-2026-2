import { useState } from 'react'
import { Button } from '../ui/Button.jsx'
import { ConfirmDialog } from '../ui/Modal.jsx'
import { useReservationActions } from '../../hooks/useReservation.js'
import { useToast, messageFromError } from '../ui/Toast.jsx'
import { formatRange } from '../../utils/format.js'

/**
 * Boton "Cancelar reserva" con confirmacion. Al cancelar, DELETE /api/reservations/{id}.
 */
export function CancelReservationButton({ reservation, onDone, variant = 'sm' }) {
  const { cancel, submitting } = useReservationActions()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [localError, setLocalError] = useState(null)

  const handleConfirm = async () => {
    setLocalError(null)
    try {
      await cancel(reservation.reservationId)
      toast.success('La reserva fue cancelada.')
    } catch (err) {
      setLocalError(messageFromError(err))
      return
    } finally {
      setOpen(false)
    }
    onDone?.()
  }

  return (
    <>
      <Button
        variant="danger"
        size={variant}
        icon="close"
        loading={submitting}
        onClick={() => setOpen(true)}
      >
        Cancelar reserva
      </Button>

      <ConfirmDialog
        open={open}
        onCancel={() => setOpen(false)}
        onConfirm={handleConfirm}
        busy={submitting}
        title="Cancelar reserva"
        confirmLabel="Cancelar reserva"
        message={
          <>
            {localError ? (
              <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{localError}</p>
            ) : null}
            ¿Seguro que deseas cancelar la reserva de{' '}
            <span className="font-semibold text-ink">{reservation.equipmentName}</span> para{' '}
            <span className="font-semibold text-ink">
              {formatRange(reservation.startTime, reservation.endTime)}
            </span>?
          </>
        }
      />
    </>
  )
}