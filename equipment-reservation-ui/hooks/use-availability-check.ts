'use client'

import { useCallback, useState } from 'react'
import { ApiError } from '@/lib/api/client'
import { getEquipmentAvailability } from '@/lib/api/equipment'
import type { AvailabilityResponse } from '@/types/equipment'

/**
 * Imperative availability check — triggered by a user action (button
 * click) rather than mounted automatically, since it depends on a
 * date range the user picks.
 */
export function useAvailabilityCheck(equipmentId: string) {
  const [result, setResult] = useState<AvailabilityResponse | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const check = useCallback(
    async (startAt: string, endAt: string) => {
      setIsChecking(true)
      setError(null)
      setResult(null)
      try {
        const response = await getEquipmentAvailability(equipmentId, startAt, endAt)
        setResult(response)
        return response
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'No se pudo verificar la disponibilidad.'
        setError(message)
        return null
      } finally {
        setIsChecking(false)
      }
    },
    [equipmentId],
  )

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { result, isChecking, error, check, reset }
}
