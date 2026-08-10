'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Badge } from '@/components/ui/badge'
import { CalendarClock } from 'lucide-react'
import type { Reservation } from '@/types/reservation'
import { formatDateTime } from '@/lib/date'
import { dictionary } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { CancelReservationDialog } from '@/components/reservations/cancel-reservation-dialog'

interface EquipmentReservationsListProps {
  reservations: Reservation[]
  isLoading: boolean
  onCancelled?: () => void
}

const STATUS_BADGE_CLASS: Record<Reservation['status'], string> = {
  ACTIVE: 'bg-status-reserved text-status-reserved-foreground border-transparent',
  CANCELLED: 'bg-muted text-muted-foreground border-transparent',
  COMPLETED: 'bg-status-available text-status-available-foreground border-transparent',
}

export function EquipmentReservationsList({ reservations, isLoading, onCancelled }: EquipmentReservationsListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (reservations.length === 0) {
    return (
      <Empty className="border border-dashed py-10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarClock />
          </EmptyMedia>
          <EmptyTitle>{dictionary.reservations.empty}</EmptyTitle>
          <EmptyDescription>{dictionary.equipment.reserveNow}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{dictionary.reservations.requester}</TableHead>
          <TableHead>{dictionary.reservations.period}</TableHead>
          <TableHead>{dictionary.reservations.status}</TableHead>
          <TableHead className="text-right">{dictionary.reservations.actions}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reservations.map((reservation) => (
          <TableRow key={reservation.id}>
            <TableCell className="font-medium">{reservation.requesterName}</TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {formatDateTime(reservation.startAt)} — {formatDateTime(reservation.endAt)}
            </TableCell>
            <TableCell>
              <Badge className={cn(STATUS_BADGE_CLASS[reservation.status])}>
                {dictionary.reservationStatus[reservation.status]}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              {reservation.status === 'ACTIVE' ? <CancelReservationDialog reservation={reservation} onCancelled={onCancelled} /> : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
