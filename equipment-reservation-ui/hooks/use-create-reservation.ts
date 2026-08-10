'use client'

import { useCallback, useState } from 'react'
import { ApiError } from '@/lib/api/client'
import { createReservation } from '@/lib/api/reservations'
import type { ReservationInput } from '@/types/reservation'

export function useCreateReservation() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(async (input: ReservationInput) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const reservation = await createReservation(input)
      return reservation
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'No se pudo crear la reserva.'
      setError(message)
      return null
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const resetError = useCallback(() => setError(null), [])

  return { submit, isSubmitting, error, resetError }
}
