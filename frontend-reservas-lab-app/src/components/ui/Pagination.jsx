import { Icon } from './Icons.jsx'
import { Button } from './Button.jsx'

/**
 * Paginador responsive: numeros en escritorio, flechas en movil.
 */
export function Pagination({ page, totalPages, totalElements, onPageChange, pageSizeLabel, size = 10 }) {
  if (totalPages <= 1 && totalElements <= size) {
    return (
      <div className="mt-5 flex items-center justify-between text-sm text-muted">
        <span>{pageSizeLabel}</span>
      </div>
    )
  }

  const start = totalElements === 0 ? 0 : page * size + 1
  const end = Math.min((page + 1) * size, totalElements)

  const pages = Array.from({ length: Math.max(totalPages, 1) }, (_, i) => i)
  const showPages = pages.filter(
    (p) => p === 0 || p === totalPages - 1 || Math.abs(p - page) <= 1,
  )
  const withGaps = []
  let prev = null
  for (const p of showPages) {
    if (prev != null && p - prev > 1) withGaps.push('gap')
    withGaps.push(p)
    prev = p
  }

  return (
    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {totalElements > 0 ? (
        <p className="text-sm text-muted">
          Mostrando <span className="font-semibold text-ink">{start}</span>–
          <span className="font-semibold text-ink">{end}</span> de{' '}
          <span className="font-semibold text-ink">{totalElements}</span>
        </p>
      ) : (
        <span />
      )}

      <nav className="flex items-center gap-1" aria-label="Paginacion">
        <Button
          variant="ghost"
          icon="chevronLeft"
          className="px-2.5 py-1.5"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          aria-label="Pagina anterior"
        />
        <div className="hidden items-center gap-1 sm:flex">
          {withGaps.map((p, idx) =>
            p === 'gap' ? (
              <span key={`gap-${idx}`} className="px-1 text-muted">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`min-w-9 rounded-full px-2.5 py-1.5 text-sm font-medium transition ${
                  p === page
                    ? 'bg-primary text-white'
                    : 'text-muted hover:bg-primary-50 hover:text-primary-dark'
                }`}
                aria-current={p === page ? 'page' : undefined}
              >
                {p + 1}
              </button>
            ),
          )}
        </div>
        <span className="rounded-full bg-primary-50 px-3 py-1.5 text-sm font-semibold text-primary-dark sm:hidden">
          {page + 1} / {Math.max(totalPages, 1)}
        </span>
        <Button
          variant="ghost"
          icon="chevronRight"
          className="px-2.5 py-1.5"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          aria-label="Pagina siguiente"
        />
      </nav>
    </div>
  )
}