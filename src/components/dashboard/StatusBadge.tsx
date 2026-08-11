import { useI18n } from '../../i18n/useI18n'
import type { EquipmentStatus, ReservationStatus } from '../../types/api'

/**
 * Indicador visual de estado (requisito 4 del Reto 3).
 *
 * Combina TRES senales: color de fondo, icono y texto traducido. Usar solo el
 * color dejaria fuera a quien tenga daltonismo o mire una impresion en blanco
 * y negro, asi que el color nunca viaja solo.
 *
 *   AVAILABLE   verde  ●  Disponible
 *   RESERVED    rojo   ●  Reservado
 *   MAINTENANCE gris   ●  En mantenimiento
 */

const EQUIPMENT_ICONS: Record<EquipmentStatus, string> = {
  AVAILABLE: '●',
  RESERVED: '●',
  MAINTENANCE: '●',
}

export function StatusBadge({ status }: { status: EquipmentStatus }) {
  const { t } = useI18n()

  return (
    <span className={`status-badge status-badge--${status}`}>
      <span className="status-badge__icon" aria-hidden="true">
        {EQUIPMENT_ICONS[status]}
      </span>
      {t(`status.${status}`)}
    </span>
  )
}

export function ReservationStatusBadge({ status }: { status: ReservationStatus }) {
  const { t } = useI18n()

  return (
    <span className={`status-badge status-badge--${status}`}>
      <span className="status-badge__icon" aria-hidden="true">
        {status === 'ACTIVE' ? '●' : '○'}
      </span>
      {t(`reservationStatus.${status}`)}
    </span>
  )
}