'use client'

import { Search, X } from 'lucide-react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { dictionary } from '@/lib/i18n'
import type { ReservationStatus } from '@/types/reservation'

interface ReservationFiltersProps {
  query: string
  onQueryChange: (value: string) => void
  status: ReservationStatus | 'ALL'
  onStatusChange: (value: ReservationStatus | 'ALL') => void
  onClear: () => void
}

const STATUS_OPTIONS: Array<ReservationStatus | 'ALL'> = ['ALL', 'ACTIVE', 'CANCELLED', 'COMPLETED']

export function ReservationFilters({ query, onQueryChange, status, onStatusChange, onClear }: ReservationFiltersProps) {
  const hasActiveFilters = query.length > 0 || status !== 'ALL'

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <InputGroup className="sm:max-w-xs">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          placeholder={dictionary.equipment.searchPlaceholder}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </InputGroup>

      <Select value={status} onValueChange={(value) => onStatusChange(value as ReservationStatus | 'ALL')}>
        <SelectTrigger className="sm:w-48">
          <SelectValue>
            {status === 'ALL' ? dictionary.equipment.allStatuses : dictionary.reservationStatus[status]}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option === 'ALL' ? dictionary.equipment.allStatuses : dictionary.reservationStatus[option]}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {hasActiveFilters ? (
        <Button variant="ghost" size="sm" onClick={onClear} className="w-fit">
          <X data-icon="inline-start" />
          {dictionary.common.clearFilters}
        </Button>
      ) : null}
    </div>
  )
}
