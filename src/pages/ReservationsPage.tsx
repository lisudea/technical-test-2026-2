import { useCallback, useEffect, useState } from 'react'

import { client } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { EmptyState, LoadingRow, Spinner } from '../components/common/Feedback'
import { ReservationStatusBadge } from '../components/dashboard/StatusBadge'
import { useToast } from '../feedback/useToast'
import { useI18n } from '../i18n/useI18n'
import { isAbortError, toDisplayableError } from '../utils/errors'
import type { DisplayableError } from '../utils/errors'
import type { Reservation } from '../types/api'

/**
 * Listado de reservas con cancelacion.
 *
 * Cierra el ciclo completo del enunciado: crear (desde el tablero), listar y
 * cancelar. La cancelacion es logica en el backend, asi que la reserva no
 * desaparece: cambia de estado a "Cancelada".
 *
 * Si se intenta cancelar una reserva ajena, el backend responde 403 y aqui se
 * muestra el aviso correspondiente.
 */
export function ReservationsPage() {
  const { t, formatDate, formatTime } = useI18n()
  const { effectiveEmail } = useAuth()
  const toast = useToast()

  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<DisplayableError | null>(null)
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const refresh = useCallback(() => setReloadToken((token) => token + 1), [])

  useEffect(() => {
    const controller = new AbortController()

    setLoading(true)
    setError(null)

    client
      .fetchReservations(controller.signal)
      .then((result) => {
        setReservations(result)
        setLoading(false)
      })
      .catch((caught) => {
        if (isAbortError(caught)) return
        setError(toDisplayableError(caught))
        setLoading(false)
      })

    return () => controller.abort()
  }, [reloadToken])

  async function handleCancel(reservation: Reservation) {
    if (!window.confirm(t('reservations.confirmCancel'))) return

    setCancellingId(reservation.id)

    try {
      // Sin sesion, el backend exige el correo del dueño para autorizar.
      await client.cancelReservation(reservation.id, effectiveEmail ?? undefined)

      toast.showSuccess('reservations.cancelled')
      refresh()
    } catch (caught) {
      toast.showError(caught)
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div className="stack">
      <div className="page-header">
        <h2>{t('reservations.title')}</h2>
        <p>{t('reservations.subtitle')}</p>
      </div>

      {!effectiveEmail && (
        <div className="alert alert--warning">
          <div>{t('reservations.onlyOwn')}</div>
        </div>
      )}

      {error && !loading && (
        <div className="alert alert--error" role="alert">
          <div style={{ flex: 1 }}>
            <span className="alert__title">{t(error.titleKey)}</span>
            <div>{t(error.bodyKey)}</div>
          </div>
          <button type="button" className="btn btn--secondary btn--sm" onClick={refresh}>
            {t('errors.retry')}
          </button>
        </div>
      )}

      {loading && <LoadingRow labelKey="reservations.loading" />}

      {!loading && !error && reservations.length === 0 && (
        <div className="card">
          <EmptyState
            icon="🗓️"
            titleKey="reservations.empty.title"
            bodyKey="reservations.empty.body"
          />
        </div>
      )}

      {!loading && reservations.length > 0 && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>{t('reservations.equipment')}</th>
                <th>{t('reservations.user')}</th>
                <th>{t('reservations.slot')}</th>
                <th>{t('reservations.status')}</th>
                <th>{t('reservations.actions')}</th>
              </tr>
            </thead>

            <tbody>
              {reservations.map((reservation) => {
                const isOwn =
                  effectiveEmail !== null &&
                  reservation.userEmail.toLowerCase() === effectiveEmail.toLowerCase()

                const isCancelled = reservation.status === 'CANCELLED'

                return (
                  <tr key={reservation.id}>
                    <td>{reservation.equipmentName}</td>

                    <td>
                      {reservation.userName}
                      <div className="table__muted">{reservation.userEmail}</div>
                    </td>

                    <td>
                      {formatDate(reservation.startTime)}
                      <div className="table__muted">
                        {formatTime(reservation.startTime)} {t('common.to')}{' '}
                        {formatTime(reservation.endTime)}
                      </div>
                    </td>

                    <td>
                      <ReservationStatusBadge status={reservation.status} />
                    </td>

                    <td>
                      {!isCancelled && (
                        <button
                          type="button"
                          className="btn btn--danger btn--sm"
                          onClick={() => handleCancel(reservation)}
                          disabled={cancellingId === reservation.id || !isOwn}
                          title={!isOwn ? t('reservations.onlyOwn') : undefined}
                        >
                          {cancellingId === reservation.id ? <Spinner /> : null}
                          {cancellingId === reservation.id
                            ? t('reservations.cancelling')
                            : t('reservations.cancel')}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}