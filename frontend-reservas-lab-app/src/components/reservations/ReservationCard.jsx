import { StatusBadge } from '../ui/StatusBadge.jsx'
import { Icon } from '../ui/Icons.jsx'
import { CancelReservationButton } from './CancelReservationButton.jsx'
import { ReservationStatus } from '../../models/enums.js'
import { formatRange } from '../../utils/format.js'

/**
 * Tarjeta de una reserva usada en dashboard y listados.
 * `showUser` permite mostrar el usuario (solo administrador).
 */
export function ReservationCard({ reservation, showUser = false, onChanged }) {
  const isCancellable =
    reservation.status === ReservationStatus.CREADA &&
    new Date(reservation.endTime) > new Date()

  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-ink">{reservation.equipmentName}</p>
          <p className="mt-0.5 font-mono text-xs text-muted">Serial/MAC: {reservation.macNumber}</p>
        </div>
        <StatusBadge status={reservation.status} variant="reservation" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
        <Icon name="calendar" className="h-4 w-4 text-primary" />
        <span className="font-medium text-ink">
          {formatRange(reservation.startTime, reservation.endTime)}
        </span>
      </div>

      {showUser ? (
        <div className="mt-2 flex items-center gap-2 text-sm text-muted">
          <Icon name="user" className="h-4 w-4 text-primary" />
          <span>
            {reservation.userName} ·{' '}
            <span className="font-medium">{reservation.userEmail}</span>
          </span>
        </div>
      ) : null}

      {isCancellable ? (
        <div className="mt-3 border-t border-line pt-3">
          <CancelReservationButton reservation={reservation} onDone={onChanged} />
        </div>
      ) : null}
    </div>
  )
}