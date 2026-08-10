import type { EstadoReserva } from '../api/types'
// Este archivo contiene un objeto llamado RESERVA_META que mapea los posibles estados de una
//  reserva a sus etiquetas de traducción y clases CSS correspondientes. Esto permite mantener la consistencia
//  en la presentación de los estados de las reservas en la interfaz de usuario, facilitando
//  la traducción y el estilo visual.
export const RESERVA_META: Record<EstadoReserva, { labelKey: string; clase: string }> = {
  ACTIVA: { labelKey: 'reservaEstado.ACTIVA', clase: 'estado-badge--busy' },
  FINALIZADA: { labelKey: 'reservaEstado.FINALIZADA', clase: 'estado-badge--ok' },
  CANCELADA: { labelKey: 'reservaEstado.CANCELADA', clase: 'estado-badge--mantenimiento' },
}
