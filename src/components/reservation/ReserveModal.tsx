import { useEffect, useState } from 'react'

import { client } from '../../api/client'
import { useAuth } from '../../auth/useAuth'
import { useToast } from '../../feedback/useToast'
import { useI18n } from '../../i18n/useI18n'
import {
  addHours,
  inputValueToApi,
  isFuture,
  minSelectableValue,
  nextFullHour,
  toInputValue,
} from '../../utils/datetime'
import { isAbortError, toDisplayableError } from '../../utils/errors'
import { Modal } from '../common/Modal'
import { Spinner } from '../common/Feedback'
import { ReservationList } from './ReservationList'
import type { DisplayableError } from '../../utils/errors'
import type { Equipment, Reservation } from '../../types/api'
import type { TranslationKey } from '../../i18n/types'

interface ReserveModalProps {
  equipment: Equipment
  onClose: () => void
  onCreated: () => void
}

/**
 * Formulario de reserva.
 *
 * Es el punto donde se demuestra el requisito 6 del Reto 3: al enviar una
 * franja que se cruza con otra reserva, el backend responde 409 y aqui se
 * traduce en un aviso claro, mostrado a la vez dentro del formulario (en rojo,
 * junto al boton) y como toast.
 *
 * Si no hay sesion iniciada, se piden nombre y correo: es el modo que exige el
 * requisito obligatorio del Reto 2. Con sesion, la identidad sale del token.
 */
export function ReserveModal({ equipment, onClose, onCreated }: ReserveModalProps) {
  const { t } = useI18n()
  const { user, guest, saveGuest } = useAuth()
  const toast = useToast()

  const [start, setStart] = useState(() => toInputValue(nextFullHour()))
  const [end, setEnd] = useState(() => toInputValue(addHours(nextFullHour(), 1)))
  const [name, setName] = useState(guest?.name ?? '')
  const [email, setEmail] = useState(guest?.email ?? '')

  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loadingSlots, setLoadingSlots] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  /** Error mostrado dentro del formulario (además del toast). */
  const [error, setError] = useState<DisplayableError | null>(null)
  /** Error de validacion detectado en el cliente, antes de llamar a la API. */
  const [localErrorKey, setLocalErrorKey] = useState<TranslationKey | null>(null)

  // Franjas ya ocupadas, para que el usuario elija con criterio.
  useEffect(() => {
    const controller = new AbortController()

    client
      .fetchReservationsByEquipment(equipment.id, controller.signal)
      .then((result) => {
        setReservations(result)
        setLoadingSlots(false)
      })
      .catch((caught) => {
        if (isAbortError(caught)) return
        // No poder leer las franjas no impide reservar.
        setLoadingSlots(false)
      })

    return () => controller.abort()
  }, [equipment.id])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    setError(null)
    setLocalErrorKey(null)

    const startIso = inputValueToApi(start)
    const endIso = inputValueToApi(end)

    // Validaciones en cliente: evitan un viaje al servidor para errores obvios
    // y dan respuesta inmediata. El backend las vuelve a comprobar igualmente.
    if (startIso >= endIso) {
      setLocalErrorKey('reserve.invalidRange')
      return
    }

    if (!isFuture(startIso)) {
      setLocalErrorKey('reserve.pastDate')
      return
    }

    if (!user && (!name.trim() || !email.trim())) {
      setLocalErrorKey('reserve.missingIdentity')
      return
    }

    setSubmitting(true)

    try {
      await client.createReservation({
        equipmentId: equipment.id,
        startTime: startIso,
        endTime: endIso,
        // Con sesion iniciada el backend ignora estos campos y usa el token.
        ...(user ? {} : { userName: name.trim(), userEmail: email.trim() }),
      })

      if (!user) saveGuest({ name: name.trim(), email: email.trim() })

      toast.showSuccess('reserve.success')
      onCreated()
      onClose()
    } catch (caught) {
      // Aqui aterriza el 409 de franja ocupada.
      const displayable = toDisplayableError(caught)
      setError(displayable)
      toast.showError(caught)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={t('reserve.title', { equipment: equipment.name })}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            {t('reserve.cancel')}
          </button>

          <button
            type="submit"
            form="reserve-form"
            className="btn btn--primary"
            disabled={submitting}
          >
            {submitting ? <Spinner /> : null}
            {submitting ? t('reserve.submitting') : t('reserve.submit')}
          </button>
        </>
      }
    >
      <ReservationList reservations={reservations} loading={loadingSlots} />

      <form id="reserve-form" onSubmit={handleSubmit} className="stack" style={{ gap: 'var(--space-3)' }}>
        <div className="grid-2">
          <div className="field">
            <label className="field__label" htmlFor="reserve-start">
              {t('reserve.start')}
            </label>
            <input
              id="reserve-start"
              type="datetime-local"
              className="field__control"
              value={start}
              min={minSelectableValue()}
              onChange={(event) => setStart(event.target.value)}
              required
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="reserve-end">
              {t('reserve.end')}
            </label>
            <input
              id="reserve-end"
              type="datetime-local"
              className="field__control"
              value={end}
              min={start || minSelectableValue()}
              onChange={(event) => setEnd(event.target.value)}
              required
            />
          </div>
        </div>

        {user ? (
          <p className="field__hint">
            {t('reserve.identityFromSession', { name: user.name || user.email, email: user.email })}
          </p>
        ) : (
          <>
            <p className="field__hint">{t('reserve.identityHint')}</p>

            <div className="grid-2">
              <div className="field">
                <label className="field__label" htmlFor="reserve-name">
                  {t('reserve.name')}
                </label>
                <input
                  id="reserve-name"
                  type="text"
                  className="field__control"
                  placeholder={t('reserve.namePlaceholder')}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="reserve-email">
                  {t('reserve.email')}
                </label>
                <input
                  id="reserve-email"
                  type="email"
                  className="field__control"
                  placeholder={t('reserve.emailPlaceholder')}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </div>
          </>
        )}

        <p className="field__hint">{t('reserve.tip')}</p>

        {/* Aviso dentro del formulario: el usuario lo ve justo donde acaba de
            pulsar, sin depender de que mire el toast de la esquina. */}
        {localErrorKey && (
          <div className="alert alert--error" role="alert">
            <div>
              <span className="alert__title">{t('errors.VALIDATION.title')}</span>
              <div className="alert__detail">{t(localErrorKey)}</div>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert--error" role="alert">
            <div>
              <span className="alert__title">{t(error.titleKey)}</span>
              <div>{t(error.bodyKey)}</div>
              {error.detail && <div className="alert__detail">{error.detail}</div>}
              {error.fieldErrors.length > 0 && (
                <ul className="alert__detail">
                  {error.fieldErrors.map((fieldError) => (
                    <li key={fieldError.field}>
                      {fieldError.field}: {fieldError.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}