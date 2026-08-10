'use client'

import { useState } from 'react'
import { ReservationFilters } from '@/components/reservations/reservation-filters'
import { ReservationsTable } from '@/components/reservations/reservations-table'
import { PaginationControl } from '@/components/shared/pagination-control'
import { useReservationsList } from '@/hooks/use-reservations-list'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { dictionary } from '@/lib/i18n'
import type { ReservationStatus } from '@/types/reservation'

const PAGE_SIZE = 10

export default function ReservationsPage() {
  const t = dictionary.reservations
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<ReservationStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(0)

  const debouncedQuery = useDebouncedValue(query, 350)

  const { reservations, totalPages, isLoading, error, refresh } = useReservationsList({
    page,
    size: PAGE_SIZE,
    status: status === 'ALL' ? undefined : status,
    query: debouncedQuery,
  })

  function handleQueryChange(value: string) {
    setQuery(value)
    setPage(0)
  }

  function handleStatusChange(value: ReservationStatus | 'ALL') {
    setStatus(value)
    setPage(0)
  }

  function handleClear() {
    setQuery('')
    setStatus('ALL')
    setPage(0)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <ReservationFilters
        query={query}
        onQueryChange={handleQueryChange}
        status={status}
        onStatusChange={handleStatusChange}
        onClear={handleClear}
      />

      <ReservationsTable
        reservations={reservations}
        isLoading={isLoading}
        error={error}
        onCancelled={() => refresh()}
      />

      <PaginationControl page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
