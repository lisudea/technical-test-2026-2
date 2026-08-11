import { PAGE_SIZE_OPTIONS } from '../../config/env'
import { useI18n } from '../../i18n/useI18n'

interface PaginationProps {
  page: number
  totalPages: number
  size: number
  first: boolean
  last: boolean
  onPageChange: (page: number) => void
  onSizeChange: (size: number) => void
}

/**
 * Controles de paginacion sobre el `Page<T>` que devuelve Spring Data.
 *
 * Los flags `first` y `last` vienen de la propia respuesta, asi que los
 * botones se deshabilitan con la verdad del servidor y no con una cuenta
 * hecha en el cliente.
 */
export function Pagination({
  page,
  totalPages,
  size,
  first,
  last,
  onPageChange,
  onSizeChange,
}: PaginationProps) {
  const { t } = useI18n()

  if (totalPages <= 1 && size === PAGE_SIZE_OPTIONS[1]) return null

  return (
    <nav className="pagination" aria-label={t('pagination.info', { current: page + 1, total: totalPages })}>
      <span className="pagination__info" aria-live="polite">
        {t('pagination.info', { current: page + 1, total: Math.max(totalPages, 1) })}
      </span>

      <div className="pagination__controls">
        <label className="text-sm text-muted" htmlFor="page-size">
          {t('pagination.pageSize')}
        </label>
        <select
          id="page-size"
          className="field__control"
          style={{ width: 'auto', minHeight: 36 }}
          value={size}
          onChange={(event) => onSizeChange(Number(event.target.value))}
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={() => onPageChange(page - 1)}
          disabled={first}
        >
          {t('pagination.previous')}
        </button>

        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={() => onPageChange(page + 1)}
          disabled={last}
        >
          {t('pagination.next')}
        </button>
      </div>
    </nav>
  )
}