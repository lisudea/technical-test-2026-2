'use client'

import { useCallback, useState } from 'react'
import { ApiError } from '@/lib/api/client'
import { cancelReservation } from '@/lib/api/reservations'

export function useCancelReservation() {
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cancel = useCallback(async (id: string) => {
    setCancellingId(id)
    setError(null)
    try {
      const reservation = await cancelReservation(id)
      return reservation
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'No se pudo cancelar la reserva.'
      setError(message)
      return null
    } finally {
      setCancellingId(null)
    }
  }, [])

  return { cancel, cancellingId, error }
}
