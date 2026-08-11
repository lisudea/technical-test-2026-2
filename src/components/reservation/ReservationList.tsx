import { useI18n } from '../../i18n/useI18n'
import type { Reservation } from '../../types/api'

/**
 * Franjas ya ocupadas de un equipo.
 *
 * Se muestra dentro del modal antes de elegir horario: enseña al usuario que
 * horas estan cogidas para que no choque contra un 409 a ciegas.
 */
export function ReservationList({
  reservations,
  loading,
}: {
  reservations: Reservation[]
  loading: boolean
}) {
  const { t, formatDate, formatTime } = useI18n()

  const active = reservations.filter((reservation) => reservation.status === 'ACTIVE')

  return (
    <section>
      <h4 className="panel__title">{t('reserve.occupied')}</h4>

      {loading && <p className="text-sm text-muted">{t('common.loading')}</p>}

      {!loading && active.length === 0 && (
        <p className="text-sm text-muted">{t('reserve.noOccupied')}</p>
      )}

      {!loading && active.length > 0 && (
        <ul className="stack" style={{ gap: 'var(--space-2)' }}>
          {active.map((reservation) => (
            <li key={reservation.id} className="text-sm">
              <span className="chip">
                {formatDate(reservation.startTime)} · {formatTime(reservation.startTime)}{' '}
                {t('common.to')} {formatTime(reservation.endTime)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}