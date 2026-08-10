import type { TopReservedEquipment } from '@/types/statistics'
import { dictionary } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function TopReservedList({ data }: { data: TopReservedEquipment[] }) {
  const maxCount = Math.max(...data.map((item) => item.reservationCount), 1)

  return (
    <ul className="flex flex-col gap-1">
      {data.map((item, index) => (
        <li key={item.equipmentId}>
          <div className={cn('flex items-center gap-4 rounded-lg px-3 py-2.5')}>
            <span className="w-5 shrink-0 text-right font-mono text-sm text-muted-foreground">{index + 1}</span>
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-medium text-foreground">
                  {item.equipmentName}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {item.reservationCount} {dictionary.statistics.reservationCount.toLowerCase()}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(item.reservationCount / maxCount) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
