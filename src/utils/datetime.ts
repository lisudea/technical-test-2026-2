/**
 * Utilidades de fecha para hablar con el backend.
 *
 * La API usa LocalDateTime de Java, es decir ISO-8601 SIN zona horaria ni
 * sufijo Z: "2026-09-01T10:00:00". Si enviásemos `date.toISOString()`
 * mandaríamos la hora en UTC y la reserva aparecería desplazada.
 */

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** Convierte un Date a "YYYY-MM-DDTHH:mm:ss" en hora local. */
export function toLocalDateTimeString(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  )
}

/** Formato que espera un <input type="datetime-local">: sin los segundos. */
export function toInputValue(date: Date): string {
  return toLocalDateTimeString(date).slice(0, 16)
}

/** El valor de un datetime-local ("2026-09-01T10:00") tal y como lo quiere la API. */
export function inputValueToApi(value: string): string {
  return value.length === 16 ? `${value}:00` : value
}

/** Ahora mismo, redondeado hacia arriba a la siguiente hora en punto. */
export function nextFullHour(): Date {
  const date = new Date()
  date.setMinutes(0, 0, 0)
  date.setHours(date.getHours() + 1)
  return date
}

export function addHours(date: Date, hours: number): Date {
  const copy = new Date(date)
  copy.setHours(copy.getHours() + hours)
  return copy
}

/** Minimo permitido en los inputs: el backend valida @Future. */
export function minSelectableValue(): string {
  return toInputValue(new Date())
}

/** true si el texto ISO local representa un instante futuro. */
export function isFuture(localIso: string): boolean {
  return new Date(localIso).getTime() > Date.now()
}