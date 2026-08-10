/**
 * Enumeraciones del backend (com.udea.labreservas.entity).
 *
 * Los @JsonValue del backend serializan los enums con estos valores de
 * despliegue ("Usuario", "Disponible", "Creada", ...), por lo que el frontend
 * trabaja con esos mismos strings.
 */

export const Role = {
  USUARIO: 'Usuario',
  ADMINISTRADOR: 'Administrador',
}

export const ROLE_VALUES = Object.freeze(Object.values(Role))

export const EquipmentStatus = {
  DISPONIBLE: 'Disponible',
  RESERVADO: 'Reservado',
  EN_PRESTAMO: 'En prestamo',
  EN_MANTENIMIENTO: 'En mantenimiento',
}

export const EQUIPMENT_STATUS_VALUES = Object.freeze(Object.values(EquipmentStatus))

export const ReservationStatus = {
  CREADA: 'Creada',
  CANCELADA: 'Cancelada',
  FINALIZADA: 'Finalizada',
}

export const RESERVATION_STATUS_VALUES = Object.freeze(Object.values(ReservationStatus))

/** Estados de equipo que impiden o desaconsejan reservarlo. */
export const EQUIPMENT_NOT_RESERVABLE = Object.freeze([EquipmentStatus.EN_MANTENIMIENTO])