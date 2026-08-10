import { EquipmentStatus, ReservationStatus, Role } from '../../models/enums.js'

const base =
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap'

const palettes = {
  teal: 'bg-primary-50 text-primary-dark ring-1 ring-primary/20',
  green: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300',
  amber: 'bg-amber-100 text-amber-800 ring-1 ring-amber-300',
  blue: 'bg-sky-100 text-sky-800 ring-1 ring-sky-300',
  red: 'bg-red-100 text-red-700 ring-1 ring-red-300',
  gray: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
  violet: 'bg-violet-100 text-violet-700 ring-1 ring-violet-300',
}

function equipmentStatusColor(status) {
  switch (status) {
    case EquipmentStatus.DISPONIBLE:
      return palettes.green
    case EquipmentStatus.RESERVADO:
      return palettes.amber
    case EquipmentStatus.EN_PRESTAMO:
      return palettes.blue
    case EquipmentStatus.EN_MANTENIMIENTO:
      return palettes.red
    default:
      return palettes.gray
  }
}

function reservationStatusColor(status) {
  switch (status) {
    case ReservationStatus.CREADA:
      return palettes.teal
    case ReservationStatus.CANCELADA:
      return palettes.red
    case ReservationStatus.FINALIZADA:
      return palettes.gray
    default:
      return palettes.gray
  }
}

function roleColor(role) {
  switch (role) {
    case Role.ADMINISTRADOR:
      return palettes.violet
    default:
      return palettes.gray
  }
}

function dotColor(colorClass) {
  if (colorClass === palettes.green) return 'bg-emerald-500'
  if (colorClass === palettes.amber) return 'bg-amber-500'
  if (colorClass === palettes.blue) return 'bg-sky-500'
  if (colorClass === palettes.red) return 'bg-red-500'
  if (colorClass === palettes.violet) return 'bg-violet-500'
  if (colorClass === palettes.teal) return 'bg-primary'
  return 'bg-gray-400'
}

/**
 * Insignia de estado coloreada segun el enum del backend.
 * Variantes: equipment | reservation | role | custom
 */
export function StatusBadge({ status, variant = 'custom', color, className = '' }) {
  let colorClass = color ?? palettes.gray
  if (variant === 'equipment') colorClass = equipmentStatusColor(status)
  if (variant === 'reservation') colorClass = reservationStatusColor(status)
  if (variant === 'role') colorClass = roleColor(status)

  return (
    <span className={`${base} ${colorClass} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor(colorClass)}`} aria-hidden="true" />
      {status}
    </span>
  )
}