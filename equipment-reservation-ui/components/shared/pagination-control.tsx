import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { dictionary } from '@/lib/i18n'

interface PaginationControlProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function PaginationControl({ page, totalPages, onPageChange }: PaginationControlProps) {
  const t = dictionary.common

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-3">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 0}
        onClick={() => onPageChange(page - 1)}
        aria-label={t.previous}
      >
        <ChevronLeft data-icon="inline-start" />
        {t.previous}
      </Button>
      <span className="text-sm text-muted-foreground">
        {t.page} {page + 1} {t.of} {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
        aria-label={t.next}
      >
        {t.next}
        <ChevronRight data-icon="inline-end" />
      </Button>
    </div>
  )
}
