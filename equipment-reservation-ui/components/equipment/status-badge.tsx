import { Badge } from '@/components/ui/badge'
import { getStatusStyle } from '@/lib/status'
import type { OperationalStatusCode } from '@/types/equipment'
import { cn } from '@/lib/utils'

export function StatusBadge({ code, className }: { code: OperationalStatusCode; className?: string }) {
  const style = getStatusStyle(code)
  const Icon = style.icon

  return (
    <Badge className={cn(style.badgeClassName, 'gap-1.5 font-medium', className)}>
      <Icon data-icon="inline-start" />
      {style.label}
    </Badge>
  )
}
