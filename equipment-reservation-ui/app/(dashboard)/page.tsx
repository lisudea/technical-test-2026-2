'use client'

import { useState } from 'react'
import { EquipmentFilters } from '@/components/equipment/equipment-filters'
import { EquipmentGrid } from '@/components/equipment/equipment-grid'
import { PaginationControl } from '@/components/shared/pagination-control'
import { useEquipmentList } from '@/hooks/use-equipment-list'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { ApiError } from '@/lib/api/client'
import { dictionary } from '@/lib/i18n'

const PAGE_SIZE = 8

export default function EquipmentDashboardPage() {
  const t = dictionary.equipment
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [operationalStatusId, setOperationalStatusId] = useState('')
  const [page, setPage] = useState(0)

  const debouncedQuery = useDebouncedValue(query, 350)

  const { equipmentPage, isLoading, error, refresh } = useEquipmentList({
    page,
    size: PAGE_SIZE,
    categoryId,
    operationalStatusId,
    query: debouncedQuery,
  })

  function updateFilter(setter: (value: string) => void) {
    return (value: string) => {
      setter(value)
      setPage(0)
    }
  }

  function handleClear() {
    setQuery('')
    setCategoryId('')
    setOperationalStatusId('')
    setPage(0)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <EquipmentFilters
        query={query}
        categoryId={categoryId}
        operationalStatusId={operationalStatusId}
        onQueryChange={updateFilter(setQuery)}
        onCategoryChange={updateFilter(setCategoryId)}
        onStatusChange={updateFilter(setOperationalStatusId)}
        onClear={handleClear}
      />

      <EquipmentGrid
        equipment={equipmentPage?.content ?? []}
        isLoading={isLoading}
        error={error instanceof ApiError ? error.message : error ? t.errorLoading : null}
        onRetry={() => refresh()}
      />

      {equipmentPage ? (
        <PaginationControl page={page} totalPages={equipmentPage.totalPages} onPageChange={setPage} />
      ) : null}
    </div>
  )
}
