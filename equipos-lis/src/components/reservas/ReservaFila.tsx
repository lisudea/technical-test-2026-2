import type { EstadoReserva, Reserva } from '../../api/types'
import { useLanguage } from '../../i18n/LanguageContext'
import { RESERVA_META } from '../../utils/reservas'
import { formatFechaHora } from '../../utils/fechas'

// Este componente representa una fila de reserva dentro del listado principal.
// Muestra los datos del usuario, las fechas de reserva y devolución, el estado actual y la acción
// de cancelar cuando la reserva está activa.

function IconoEstado({ estado }: { estado: EstadoReserva }) {
  if (estado === 'ACTIVA') {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M8 4.5V8l2.5 1.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  if (estado === 'FINALIZADA') {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M5 8.5l2 2 4-4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.5 5.5l5 5M10.5 5.5l-5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export interface ReservaFilaProps {
  reserva: Reserva
  cancelando: boolean
  onCancelar: (reserva: Reserva) => void
}

export default function ReservaFila({ reserva, cancelando, onCancelar }: ReservaFilaProps) {
  const { t, lang } = useLanguage()
  const meta = RESERVA_META[reserva.estado]

  return (
    <article className="reserva-fila">
      <div className="reserva-fila__principal">
        <h3 className="reserva-fila__equipo">{reserva.equipo.nombre}</h3>
        <p className="reserva-fila__usuario">
          {reserva.usuario.nombre} · {reserva.usuario.correo}
        </p>
      </div>
      <div className="reserva-fila__fechas">
        <time dateTime={reserva.fechaReserva}>
          {formatFechaHora(reserva.fechaReserva, lang)}
        </time>
        <span className="reserva-fila__flecha" aria-hidden="true">
          →
        </span>
        <time dateTime={reserva.fechaDevolucion}>
          {formatFechaHora(reserva.fechaDevolucion, lang)}
        </time>
      </div>
      <div className="reserva-fila__estado">
        <span className={`estado-badge ${meta.clase}`}>
          <IconoEstado estado={reserva.estado} />
          {t(meta.labelKey)}
        </span>
        {reserva.estado === 'ACTIVA' && (
          <button
            type="button"
            className="btn btn--sm btn--danger"
            disabled={cancelando}
            aria-label={`${t('reservas.cancelar')}: ${reserva.equipo.nombre}`}
            onClick={() => onCancelar(reserva)}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M2 4.5h12M6.5 4.5V3h3v1.5M4 4.5l.7 8.5h6.6l.7-8.5M6.5 7v4M9.5 7v4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {cancelando && <span className="btn__spinner" aria-hidden="true" />}
            {t('reservas.cancelarBtn')}
          </button>
        )}
      </div>
    </article>
  )
}
