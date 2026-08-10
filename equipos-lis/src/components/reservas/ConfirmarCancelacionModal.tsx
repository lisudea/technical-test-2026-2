import { useEffect, useRef } from 'react'
import type { Reserva } from '../../api/types'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatFechaHora } from '../../utils/fechas'

// Este componente muestra un modal de confirmación antes de cancelar una reserva.
// Su objetivo es pedir una confirmación explícita al usuario y evitar acciones accidentales sobre
// reservas activas, además de mostrar el estado de carga y posibles errores.

export interface ConfirmarCancelacionModalProps {
  reserva: Reserva
  cancelando: boolean
  error: string | null
  onConfirmar: () => void
  onClose: () => void
}

export default function ConfirmarCancelacionModal({
  reserva,
  cancelando,
  error,
  onConfirmar,
  onClose,
}: ConfirmarCancelacionModalProps) {
  const { t, lang } = useLanguage()
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) {
      dialog.showModal()
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby="modal-cancelar-titulo"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget && !cancelando) onClose()
      }}
    >
      <div className="modal__inner">
        <div className="modal__head">
          <h2 className="modal__titulo" id="modal-cancelar-titulo">
            {t('reservas.cancelarConfirmar.titulo')}
          </h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label={t('modal.cerrar')}
            disabled={cancelando}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M2 2l12 12M14 2L2 14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <p className="modal__texto">
          {t('reservas.cancelarConfirmar.texto', { equipo: reserva.equipo.nombre })}
        </p>
        <p className="modal__detalle">
          {formatFechaHora(reserva.fechaReserva, lang)} →{' '}
          {formatFechaHora(reserva.fechaDevolucion, lang)}
        </p>

        {error && (
          <div className="alerta" role="alert">
            <p>{error}</p>
          </div>
        )}

        <div className="modal__acciones">
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={cancelando}>
            {t('reservas.cancelarConfirmar.volver')}
          </button>
          <button
            type="button"
            className="btn btn--primary btn--danger"
            onClick={onConfirmar}
            disabled={cancelando}
          >
            {cancelando && <span className="btn__spinner" aria-hidden="true" />}
            {t('reservas.cancelarConfirmar.confirmar')}
          </button>
        </div>
      </div>
    </dialog>
  )
}
