import type { EstadoEquipo } from '../../api/types'
import { ESTADO_META } from '../../utils/equipos'
import { useLanguage } from '../../i18n/LanguageContext'

// Este componente representa visualmente el estado de un equipo mediante un badge y un icono.
// La apariencia cambia según el estado para permitir identificar rápidamente si el equipo está disponible,
// reservado o en mantenimiento.

function IconoEstado({ estado }: { estado: EstadoEquipo }) {
  if (estado === 'DISPONIBLE') {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M5.5 8.2l1.8 1.8 3.4-3.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  if (estado === 'RESERVADO') {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <rect
          x="2.5"
          y="4"
          width="11"
          height="9.5"
          rx="1.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M2.5 7h11M5.5 2.5v3M10.5 2.5v3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4 12L12 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function EstadoBadge({ estado }: { estado: EstadoEquipo }) {
  const { t } = useLanguage()
  const meta = ESTADO_META[estado]
  return (
    <span className={`estado-badge ${meta.clase}`}>
      <IconoEstado estado={estado} />
      {t(meta.labelKey)}
    </span>
  )
}
