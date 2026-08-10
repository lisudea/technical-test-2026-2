'use client'

import { Search, X } from 'lucide-react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEquipmentCatalogs } from '@/hooks/use-equipment-catalogs'
import { dictionary } from '@/lib/i18n'

const ALL = '__all__'

interface EquipmentFiltersProps {
  query: string
  categoryId: string
  operationalStatusId: string
  onQueryChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onStatusChange: (value: string) => void
  onClear: () => void
}

export function EquipmentFilters({
  query,
  categoryId,
  operationalStatusId,
  onQueryChange,
  onCategoryChange,
  onStatusChange,
  onClear,
}: EquipmentFiltersProps) {
  const t = dictionary.equipment
  const { categories, statuses } = useEquipmentCatalogs()
  const selectedCategory = categories.find((category) => category.id === categoryId)
  const selectedStatus = statuses.find((status) => status.id === operationalStatusId)
  const hasActiveFilters = Boolean(query || categoryId || operationalStatusId)

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <InputGroup className="md:max-w-sm">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          placeholder={t.searchPlaceholder}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </InputGroup>

      <Select value={categoryId || ALL} onValueChange={(value) => onCategoryChange(value === ALL ? '' : value)}>
        <SelectTrigger className="w-full md:w-48">
          <SelectValue>{selectedCategory?.name ?? t.allCategories}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={ALL}>{t.allCategories}</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={operationalStatusId || ALL}
        onValueChange={(value) => onStatusChange(value === ALL ? '' : value)}
      >
        <SelectTrigger className="w-full md:w-48">
          <SelectValue>{selectedStatus?.name ?? t.allStatuses}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={ALL}>{t.allStatuses}</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status.id} value={status.id}>
                {status.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {hasActiveFilters ? (
        <Button variant="ghost" onClick={onClear} className="md:ml-auto">
          <X data-icon="inline-start" />
          {dictionary.common.clearFilters}
        </Button>
      ) : null}
    </div>
  )
}
