import { useI18n } from '../../i18n/useI18n'
import { EQUIPMENT_CATEGORIES, EQUIPMENT_STATUSES } from '../../types/api'
import type { EquipmentCategory, EquipmentFilters, EquipmentStatus } from '../../types/api'

interface FiltersPanelProps {
  filters: EquipmentFilters
  onChange: <K extends keyof EquipmentFilters>(key: K, value: EquipmentFilters[K]) => void
  onClear: () => void
  shown: number
  total: number
}

/**
 * Panel de filtros dinamicos (requisito 5 del Reto 3).
 *
 * Categoria y estado viajan al backend como parametros de consulta y provocan
 * una nueva peticion; la busqueda por texto se resuelve en cliente porque la
 * API no expone un parametro de nombre (queda anotado como limitacion).
 *
 * En ningun caso se recarga la pagina: React actualiza el listado en sitio.
 *
 * En movil el panel se pliega dentro de un <details> para no ocupar toda la
 * pantalla antes de ver un solo equipo.
 */
export function FiltersPanel({ filters, onChange, onClear, shown, total }: FiltersPanelProps) {
  const { t } = useI18n()

  const hasActiveFilters = Boolean(filters.category || filters.status || filters.search)

  return (
    <section className="card filters" aria-label={t('filters.title')}>
      <details className="filters__disclosure" open>
        <summary>{t('filters.title')}</summary>

        <div className="filters__grid">
          <div className="field">
            <label className="field__label" htmlFor="filter-search">
              {t('filters.search')}
            </label>
            <input
              id="filter-search"
              type="search"
              className="field__control"
              placeholder={t('filters.searchPlaceholder')}
              value={filters.search}
              onChange={(event) => onChange('search', event.target.value)}
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="filter-category">
              {t('filters.category')}
            </label>
            <select
              id="filter-category"
              className="field__control"
              value={filters.category}
              onChange={(event) =>
                onChange('category', event.target.value as EquipmentCategory | '')
              }
            >
              <option value="">{t('filters.all')}</option>
              {EQUIPMENT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {t(`category.${category}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="filter-status">
              {t('filters.status')}
            </label>
            <select
              id="filter-status"
              className="field__control"
              value={filters.status}
              onChange={(event) => onChange('status', event.target.value as EquipmentStatus | '')}
            >
              <option value="">{t('filters.allStatuses')}</option>
              {EQUIPMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`status.${status}`)}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button type="button" className="btn btn--secondary" onClick={onClear}>
              {t('filters.clear')}
            </button>
          )}
        </div>

        <div className="filters__footer">
          <span aria-live="polite">{t('filters.results', { shown, total })}</span>
          {filters.search && <span className="text-xs">{t('filters.searchHint')}</span>}
        </div>
      </details>
    </section>
  )
}