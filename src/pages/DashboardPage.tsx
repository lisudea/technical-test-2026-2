import { useCallback, useState } from 'react'

import { EquipmentCard } from '../components/dashboard/EquipmentCard'
import { FiltersPanel } from '../components/dashboard/FiltersPanel'
import { Pagination } from '../components/dashboard/Pagination'
import { StatsBar } from '../components/dashboard/StatsBar'
import { EmptyState, SkeletonCard } from '../components/common/Feedback'
import { ReserveModal } from '../components/reservation/ReserveModal'
import { useEquipment } from '../hooks/useEquipment'
import { useI18n } from '../i18n/useI18n'
import type { Equipment } from '../types/api'

/**
 * Tablero principal (requisitos 3, 4 y 5 del Reto 3).
 *
 * Lista los equipos consumiendo la API del Reto 2, los marca con indicadores
 * de estado por color e icono, y permite filtrarlos sin recargar la pagina.
 */
export function DashboardPage() {
  const { t } = useI18n()
  const {
    items,
    page,
    filters,
    setFilter,
    clearFilters,
    pageNumber,
    setPageNumber,
    size,
    setSize,
    loading,
    error,
    refresh,
  } = useEquipment()

  const [selected, setSelected] = useState<Equipment | null>(null)
  const [statsToken, setStatsToken] = useState(0)

  const handleCreated = useCallback(() => {
    // Tras reservar, recargamos listado e indicadores para reflejar el cambio.
    refresh()
    setStatsToken((token) => token + 1)
  }, [refresh])

  return (
    <div className="stack">
      <div className="page-header">
        <h2>{t('dashboard.title')}</h2>
        <p>{t('app.subtitle')}</p>
      </div>

      <StatsBar reloadToken={statsToken} />

      <FiltersPanel
        filters={filters}
        onChange={setFilter}
        onClear={clearFilters}
        shown={items.length}
        total={page?.totalElements ?? 0}
      />

      {/* Error de carga: se explica y se ofrece reintentar, en vez de dejar
          el tablero vacio sin decir por que. */}
      {error && !loading && (
        <div className="alert alert--error" role="alert">
          <div style={{ flex: 1 }}>
            <span className="alert__title">{t(error.titleKey)}</span>
            <div>{t(error.bodyKey)}</div>
            {error.detail && <div className="alert__detail">{error.detail}</div>}
          </div>
          <button type="button" className="btn btn--secondary btn--sm" onClick={refresh}>
            {t('errors.retry')}
          </button>
        </div>
      )}

      {loading && (
        <div className="equipment-grid" aria-busy="true" aria-label={t('dashboard.loading')}>
          {Array.from({ length: 6 }, (_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="card">
          <EmptyState
            icon="🔍"
            titleKey="dashboard.empty.title"
            bodyKey="dashboard.empty.body"
            action={
              <button type="button" className="btn btn--secondary" onClick={clearFilters}>
                {t('filters.clear')}
              </button>
            }
          />
        </div>
      )}

      {!loading && items.length > 0 && (
        <>
          <div className="equipment-grid">
            {items.map((equipment) => (
              <EquipmentCard key={equipment.id} equipment={equipment} onReserve={setSelected} />
            ))}
          </div>

          {page && (
            <Pagination
              page={pageNumber}
              totalPages={page.totalPages}
              size={size}
              first={page.first}
              last={page.last}
              onPageChange={setPageNumber}
              onSizeChange={(next) => {
                setSize(next)
                setPageNumber(0)
              }}
            />
          )}
        </>
      )}

      {selected && (
        <ReserveModal
          equipment={selected}
          onClose={() => setSelected(null)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}