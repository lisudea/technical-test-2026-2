import type { Lang } from '../i18n/translations'

// Este archivo contiene funciones utilitarias para formatear fechas y horas en la aplicación.
export function formatFechaHora(iso: string, lang: Lang): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

// La función aISO convierte una fecha y hora en formato local (YYYY-MM-DDTHH:mm) a un 
// formato ISO (YYYY-MM-DDTHH:mm:ss).
export function aISO(datetimeLocal: string): string {
  return datetimeLocal ? `${datetimeLocal}:00` : ''
}
