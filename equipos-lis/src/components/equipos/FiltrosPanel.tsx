import { CATEGORIAS, ESTADOS_EQUIPO } from '../../api/types'
import type { CategoriaEquipo, EstadoEquipo } from '../../api/types'
import { useLanguage } from '../../i18n/LanguageContext'

// Este componente encapsula el formulario de filtros utilizado en la vista de equipos.
// Permite cambiar la categoría y el estado del listado, y ofrece una acción para limpiar los filtros
// aplicados sin salir de la página.

export interface FiltrosPanelProps {
  categoria: CategoriaEquipo | ''
  estado: EstadoEquipo | ''
  hayFiltros: boolean
  onCategoriaChange: (categoria: CategoriaEquipo | '') => void
  onEstadoChange: (estado: EstadoEquipo | '') => void
  onLimpiar: () => void
}

export default function FiltrosPanel({
  categoria,
  estado,
  hayFiltros,
  onCategoriaChange,
  onEstadoChange,
  onLimpiar,
}: FiltrosPanelProps) {
  const { t } = useLanguage()

  return (
    <form
      className="filtros"
      role="search"
      onSubmit={(event) => event.preventDefault()}
    >
      <label className="campo">
        <span className="campo__label">{t('filtros.categoria')}</span>
        <span className="campo__select-wrap">
          <select
            className="campo__select"
            value={categoria}
            onChange={(event) =>
              onCategoriaChange(event.target.value as CategoriaEquipo | '')
            }
          >
            <option value="">{t('filtros.todasCategorias')}</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {t(`categoria.${c}`)}
              </option>
            ))}
          </select>
        </span>
      </label>

      <label className="campo">
        <span className="campo__label">{t('filtros.estado')}</span>
        <span className="campo__select-wrap">
          <select
            className="campo__select"
            value={estado}
            onChange={(event) =>
              onEstadoChange(event.target.value as EstadoEquipo | '')
            }
          >
            <option value="">{t('filtros.todosEstados')}</option>
            {ESTADOS_EQUIPO.map((e) => (
              <option key={e} value={e}>
                {t(`estado.${e}`)}
              </option>
            ))}
          </select>
        </span>
      </label>

      {hayFiltros && (
        <button type="button" className="btn btn--ghost" onClick={onLimpiar}>
          {t('filtros.limpiar')}
        </button>
      )}
    </form>
  )
}
