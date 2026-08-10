const esWeekdays = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
const esMonths = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]

function pad(n) {
  return String(n).padStart(2, '0')
}

function toDate(value) {
  if (!value) return null
  const d = typeof value === 'string' ? new Date(value) : value
  return Number.isNaN(d.getTime()) ? null : d
}

/** "lunes 9 ago 2026" */
export function formatLongDate(value) {
  const d = toDate(value)
  if (!d) return '—'
  return `${esWeekdays[d.getDay()]} ${d.getDate()} ${esMonths[d.getMonth()]} ${d.getFullYear()}`
}

/** "lun 9 ago" corto */
export function formatShortDate(value) {
  const d = toDate(value)
  if (!d) return '—'
  return `${esWeekdays[d.getDay()].slice(0, 3)} ${d.getDate()} ${esMonths[d.getMonth()]}`
}

/** "08:00" */
export function formatTime(value) {
  const d = toDate(value)
  if (!d) return '—'
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** "lun 9 ago · 08:00 - 11:00" */
export function formatRange(start, end) {
  if (!start || !end) return '—'
  const sameDay =
    toDate(start).toDateString() === toDate(end).toDateString()
  const day = sameDay ? formatShortDate(start) : `${formatShortDate(start)} → ${formatShortDate(end)}`
  return `${day} · ${formatTime(start)} - ${formatTime(end)}`
}

/**
 * Convierte un valor de <input type="datetime-local"> ("2026-08-09T14:30")
 * al formato que espera el backend (LocalDateTime ISO: "2026-08-09T14:30:00").
 */
export function toBackendDateTime(datetimeLocal) {
  if (!datetimeLocal) return null
  return `${datetimeLocal}:00`
}

/** Convierte "2026-08-09T14:30:00" al valor para <input datetime-local>. */
export function fromBackendDateTime(value) {
  const d = toDate(value)
  if (!d) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function initialsOf(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
}