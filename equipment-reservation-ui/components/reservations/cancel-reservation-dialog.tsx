'use client'

import { toast } from 'sonner'
import { CircleX } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useCancelReservation } from '@/hooks/use-cancel-reservation'
import { dictionary } from '@/lib/i18n'
import type { Reservation } from '@/types/reservation'

interface CancelReservationDialogProps {
  reservation: Reservation
  onCancelled?: () => void
}

export function CancelReservationDialog({ reservation, onCancelled }: CancelReservationDialogProps) {
  const t = dictionary.reservations
  const { cancel, cancellingId, error } = useCancelReservation()
  const isCancelling = cancellingId === reservation.id

  async function handleConfirm(event: React.MouseEvent) {
    event.preventDefault()
    const result = await cancel(reservation.id)
    if (result) {
      toast.success(t.cancelSuccess, { description: reservation.equipmentName })
      onCancelled?.()
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size="sm">
            <CircleX data-icon="inline-start" />
            {t.cancel}
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <CircleX />
          </AlertDialogMedia>
          <AlertDialogTitle>{t.cancelConfirmTitle}</AlertDialogTitle>
          <AlertDialogDescription>{t.cancelConfirmDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel>{dictionary.reservationForm.cancelAction}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isCancelling} variant="destructive">
            {isCancelling ? <Spinner data-icon="inline-start" /> : null}
            {isCancelling ? t.cancelling : t.confirmCancel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
