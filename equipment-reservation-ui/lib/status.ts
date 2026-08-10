import { CheckCircle2, Wrench, CalendarClock, type LucideIcon } from 'lucide-react'
import type { OperationalStatusCode } from '@/types/equipment'
import { dictionary } from '@/lib/i18n'

interface StatusStyle {
  label: string
  badgeClassName: string
  dotClassName: string
  icon: LucideIcon
}

const STATUS_STYLES: Record<OperationalStatusCode, StatusStyle> = {
  AVAILABLE: {
    label: dictionary.status.AVAILABLE,
    badgeClassName: 'bg-status-available text-status-available-foreground border-transparent',
    dotClassName: 'bg-status-available-foreground',
    icon: CheckCircle2,
  },
  RESERVED: {
    label: dictionary.status.RESERVED,
    badgeClassName: 'bg-status-reserved text-status-reserved-foreground border-transparent',
    dotClassName: 'bg-status-reserved-foreground',
    icon: CalendarClock,
  },
  MAINTENANCE: {
    label: dictionary.status.MAINTENANCE,
    badgeClassName: 'bg-status-maintenance text-status-maintenance-foreground border-transparent',
    dotClassName: 'bg-status-maintenance-foreground',
    icon: Wrench,
  },
}

export function getStatusStyle(code: OperationalStatusCode): StatusStyle {
  return STATUS_STYLES[code] ?? STATUS_STYLES.MAINTENANCE
}
