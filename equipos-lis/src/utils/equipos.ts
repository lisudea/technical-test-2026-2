import type { EstadoEquipo } from '../api/types'
// Este archivo contiene un objeto llamado ESTADO_META que mapea los posibles estados de un
//  equipo a sus etiquetas de traducción y clases CSS correspondientes. Esto permite mantener la consistencia
//  en la presentación de los estados de los equipos en la interfaz de usuario, facilitando
//  la traducción y el estilo visual.
export const ESTADO_META: Record<EstadoEquipo, { labelKey: string; clase: string }> = {
  DISPONIBLE: { labelKey: 'estado.DISPONIBLE', clase: 'estado-badge--ok' },
  RESERVADO: { labelKey: 'estado.RESERVADO', clase: 'estado-badge--busy' },
  MANTENIMIENTO: { labelKey: 'estado.MANTENIMIENTO', clase: 'estado-badge--mantenimiento' },
}
