'use client'

import { useState } from 'react'
import { CalendarCheck, CircleAlert, CircleCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { useAvailabilityCheck } from '@/hooks/use-availability-check'
import { isRangeValid, localInputToIso } from '@/lib/date'
import { dictionary } from '@/lib/i18n'

interface AvailabilityCheckerProps {
  equipmentId: string
  onAvailableRange?: (startAt: string, endAt: string) => void
}

export function AvailabilityChecker({ equipmentId, onAvailableRange }: AvailabilityCheckerProps) {
  const t = dictionary.availability
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [rangeError, setRangeError] = useState<string | null>(null)
  const { result, isChecking, error, check } = useAvailabilityCheck(equipmentId)

  async function handleCheck() {
    if (!startAt || !endAt) return
    const startIso = localInputToIso(startAt)
    const endIso = localInputToIso(endAt)

    if (!isRangeValid(startIso, endIso)) {
      setRangeError(t.invalidRange)
      return
    }
    setRangeError(null)
    const response = await check(startIso, endIso)
    if (response?.availability === 'AVAILABLE' && onAvailableRange) {
      onAvailableRange(startIso, endIso)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="size-4" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field data-invalid={Boolean(rangeError) || undefined}>
            <FieldLabel htmlFor="start-at">{t.startAt}</FieldLabel>
            <Input
              id="start-at"
              type="datetime-local"
              value={startAt}
              onChange={(event) => setStartAt(event.target.value)}
              aria-invalid={Boolean(rangeError) || undefined}
            />
          </Field>
          <Field data-invalid={Boolean(rangeError) || undefined}>
            <FieldLabel htmlFor="end-at">{t.endAt}</FieldLabel>
            <Input
              id="end-at"
              type="datetime-local"
              value={endAt}
              onChange={(event) => setEndAt(event.target.value)}
              aria-invalid={Boolean(rangeError) || undefined}
            />
          </Field>
        </FieldGroup>

        {rangeError ? <p className="text-sm text-destructive">{rangeError}</p> : null}

        <Button onClick={handleCheck} disabled={isChecking || !startAt || !endAt} className="sm:w-fit">
          {isChecking ? <Spinner data-icon="inline-start" /> : <CalendarCheck data-icon="inline-start" />}
          {isChecking ? t.checking : t.check}
        </Button>

        {error ? (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertTitle>{dictionary.common.error}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {result && !error ? (
          <Alert variant={result.availability === 'AVAILABLE' ? 'default' : 'destructive'}>
            {result.availability === 'AVAILABLE' ? <CircleCheck /> : <CircleAlert />}
            <AlertTitle>{result.availability === 'AVAILABLE' ? t.available : t.unavailable}</AlertTitle>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  )
}
