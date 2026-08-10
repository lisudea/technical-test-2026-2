import type { Equipo } from '../../api/types'
import { useLanguage } from '../../i18n/LanguageContext'
import EstadoBadge from './EstadoBadge'

// Este componente renderiza la tarjeta visual de un equipo dentro del listado principal.
// Muestra información esencial como el número de serie, el nombre, la categoría y el estado,
// además de un botón para abrir la edición del equipo desde la vista de gestión.

export interface EquipoCardProps {
  equipo: Equipo
  onEditar: (equipo: Equipo) => void
}

export default function EquipoCard({ equipo, onEditar }: EquipoCardProps) {
  const { t } = useLanguage()

  return (
    <article className="equipo-card">
      <div className="equipo-card__head">
        <span className="equipo-card__serie">{equipo.numeroSerie}</span>
        <div className="equipo-card__acciones">
          <button
            type="button"
            className="icon-btn"
            aria-label={`${t('equipos.editar')}: ${equipo.nombre}`}
            onClick={() => onEditar(equipo)}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M11.3 2.7l2 2L5.5 12.5 2 13l.5-3.5 8.8-6.8z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <EstadoBadge estado={equipo.estado} />
        </div>
      </div>
      <h2 className="equipo-card__nombre">{equipo.nombre}</h2>
      <p className="equipo-card__categoria">{t(`categoria.${equipo.categoria}`)}</p>
    </article>
  )
}
