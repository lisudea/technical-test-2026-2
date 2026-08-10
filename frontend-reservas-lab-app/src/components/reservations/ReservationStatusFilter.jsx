/**
 * Filtro segmentado de estado para las reservas (activas / canceladas / todas).
 * Cada opcion muestra su conteo cuando `counts` esta disponible.
 */
export function ReservationStatusFilter({ value, onChange, counts }) {
  const options = [
    { key: 'activas', label: 'Activas' },
    { key: 'canceladas', label: 'Canceladas' },
    { key: 'todas', label: 'Todas' },
  ]

  return (
    <div
      className="inline-flex flex-wrap items-center gap-1 rounded-full border border-line bg-white p-1"
      role="tablist"
      aria-label="Filtrar reservas por estado"
    >
      {options.map((option) => {
        const active = value === option.key
        const count = counts?.[option.key]
        return (
          <button
            key={option.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.key)}
            className={
              active
                ? 'inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-white'
                : 'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted transition hover:bg-gray-50 hover:text-ink'
            }
          >
            {option.label}
            {count !== undefined ? (
              <span
                className={
                  active
                    ? 'rounded-full bg-white/20 px-1.5 py-0.5 text-xs font-semibold'
                    : 'rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-muted'
                }
              >
                {count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}