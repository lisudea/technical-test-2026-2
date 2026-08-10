'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { CalendarClock } from 'lucide-react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useCreateReservation } from '@/hooks/use-create-reservation'
import { isRangeValid, isoToLocalInput, localInputToIso } from '@/lib/date'
import { dictionary } from '@/lib/i18n'

interface ReservationDialogProps {
  equipmentId: string
  equipmentName: string
  initialStartAt?: string
  initialEndAt?: string
  trigger: React.ReactNode
  onReserved?: () => void
}

export function ReservationDialog({
  equipmentId,
  equipmentName,
  initialStartAt,
  initialEndAt,
  trigger,
  onReserved,
}: ReservationDialogProps) {
  const t = dictionary.reservationForm
  const [open, setOpen] = useState(false)
  const [requesterName, setRequesterName] = useState('')
  const [requesterEmail, setRequesterEmail] = useState('')
  const [purpose, setPurpose] = useState('')
  const [startAt, setStartAt] = useState(initialStartAt ? isoToLocalInput(initialStartAt) : '')
  const [endAt, setEndAt] = useState(initialEndAt ? isoToLocalInput(initialEndAt) : '')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const { submit, isSubmitting, error, resetError } = useCreateReservation()

  function validate() {
    const errors: Record<string, string> = {}
    if (!requesterName.trim()) errors.requesterName = 'Este campo es obligatorio.'
    if (!startAt) errors.startAt = 'Este campo es obligatorio.'
    if (!endAt) errors.endAt = 'Este campo es obligatorio.'
    if (startAt && endAt && !isRangeValid(localInputToIso(startAt), localInputToIso(endAt))) {
      errors.endAt = dictionary.availability.invalidRange
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit() {
    resetError()
    if (!validate()) return

    const reservation = await submit({
      equipmentId,
      requesterName: requesterName.trim(),
      requesterEmail: requesterEmail.trim() || undefined,
      purpose: purpose.trim() || undefined,
      startAt: localInputToIso(startAt),
      endAt: localInputToIso(endAt),
    })

    if (reservation) {
      toast.success(t.success, { description: equipmentName })
      setOpen(false)
      setRequesterName('')
      setRequesterEmail('')
      setPurpose('')
      onReserved?.()
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          setFieldErrors({})
          resetError()
        }
      }}
    >
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="size-4" />
            {t.title}
          </DialogTitle>
          <DialogDescription>
            {t.description} <span className="font-medium text-foreground">{equipmentName}</span>
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field data-invalid={Boolean(fieldErrors.requesterName) || undefined}>
            <FieldLabel htmlFor="requester-name">{t.requesterName}</FieldLabel>
            <Input
              id="requester-name"
              value={requesterName}
              onChange={(event) => setRequesterName(event.target.value)}
              aria-invalid={Boolean(fieldErrors.requesterName) || undefined}
            />
            {fieldErrors.requesterName ? <FieldError>{fieldErrors.requesterName}</FieldError> : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="requester-email">{t.requesterEmail}</FieldLabel>
            <Input
              id="requester-email"
              type="email"
              value={requesterEmail}
              onChange={(event) => setRequesterEmail(event.target.value)}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field data-invalid={Boolean(fieldErrors.startAt) || undefined}>
              <FieldLabel htmlFor="reservation-start">{dictionary.availability.startAt}</FieldLabel>
              <Input
                id="reservation-start"
                type="datetime-local"
                value={startAt}
                onChange={(event) => setStartAt(event.target.value)}
                aria-invalid={Boolean(fieldErrors.startAt) || undefined}
              />
              {fieldErrors.startAt ? <FieldError>{fieldErrors.startAt}</FieldError> : null}
            </Field>
            <Field data-invalid={Boolean(fieldErrors.endAt) || undefined}>
              <FieldLabel htmlFor="reservation-end">{dictionary.availability.endAt}</FieldLabel>
              <Input
                id="reservation-end"
                type="datetime-local"
                value={endAt}
                onChange={(event) => setEndAt(event.target.value)}
                aria-invalid={Boolean(fieldErrors.endAt) || undefined}
              />
              {fieldErrors.endAt ? <FieldError>{fieldErrors.endAt}</FieldError> : null}
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="purpose">{t.purpose}</FieldLabel>
            <Textarea
              id="purpose"
              placeholder={t.purposePlaceholder}
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              rows={3}
            />
          </Field>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </FieldGroup>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">{t.cancelAction}</Button>} />
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
            {isSubmitting ? t.submitting : t.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
