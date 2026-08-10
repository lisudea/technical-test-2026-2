'use client'

import { CalendarClock } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { CancelReservationDialog } from '@/components/reservations/cancel-reservation-dialog'
import type { Reservation } from '@/types/reservation'
import { formatDateTime } from '@/lib/date'
import { dictionary } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface ReservationsTableProps {
  reservations: Reservation[]
  isLoading: boolean
  error?: unknown
  onCancelled: () => void
}

const STATUS_BADGE_CLASS: Record<Reservation['status'], string> = {
  ACTIVE: 'bg-status-reserved text-status-reserved-foreground border-transparent',
  CANCELLED: 'bg-muted text-muted-foreground border-transparent',
  COMPLETED: 'bg-status-available text-status-available-foreground border-transparent',
}

export function ReservationsTable({ reservations, isLoading, error, onCancelled }: ReservationsTableProps) {
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{dictionary.common.error}</AlertTitle>
        <AlertDescription>{dictionary.equipment.errorLoading}</AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    )
  }

  if (reservations.length === 0) {
    return (
      <Empty className="border border-dashed py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarClock />
          </EmptyMedia>
          <EmptyTitle>{dictionary.reservations.empty}</EmptyTitle>
          <EmptyDescription>{dictionary.equipment.title}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{dictionary.reservations.equipment}</TableHead>
          <TableHead>{dictionary.reservations.requester}</TableHead>
          <TableHead>{dictionary.reservations.period}</TableHead>
          <TableHead>{dictionary.reservations.status}</TableHead>
          <TableHead className="text-right">{dictionary.reservations.actions}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reservations.map((reservation) => (
          <TableRow key={reservation.id}>
            <TableCell className="font-medium">{reservation.equipmentName}</TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span>{reservation.requesterName}</span>
                {reservation.requesterEmail ? (
                  <span className="text-xs text-muted-foreground">{reservation.requesterEmail}</span>
                ) : null}
              </div>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatDateTime(reservation.startAt)} — {formatDateTime(reservation.endAt)}
            </TableCell>
            <TableCell>
              <Badge className={cn(STATUS_BADGE_CLASS[reservation.status])}>
                {dictionary.reservationStatus[reservation.status]}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              {reservation.status === 'ACTIVE' ? (
                <CancelReservationDialog reservation={reservation} onCancelled={onCancelled} />
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
