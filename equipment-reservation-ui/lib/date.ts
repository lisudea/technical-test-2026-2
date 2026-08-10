import { format, formatDistanceToNow, isAfter, isValid, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatDateTime(value: string) {
  const date = parseISO(value)
  if (!isValid(date)) return '—'
  return format(date, "d 'de' MMMM, HH:mm", { locale: es })
}

export function formatDate(value: string) {
  const date = parseISO(value)
  if (!isValid(date)) return '—'
  return format(date, 'd MMM yyyy', { locale: es })
}

export function formatRelative(value: string) {
  const date = parseISO(value)
  if (!isValid(date)) return '—'
  return formatDistanceToNow(date, { locale: es, addSuffix: true })
}

export function isRangeValid(startAt: string, endAt: string) {
  const start = parseISO(startAt)
  const end = parseISO(endAt)
  return isValid(start) && isValid(end) && isAfter(end, start)
}

/** Converts a `datetime-local` input value (no timezone) to an ISO string with offset. */
export function localInputToIso(value: string) {
  if (!value) return ''
  const date = new Date(value)
  return date.toISOString()
}

/** Converts an ISO string to the `datetime-local` input format. */
export function isoToLocalInput(value: string) {
  const date = parseISO(value)
  if (!isValid(date)) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
