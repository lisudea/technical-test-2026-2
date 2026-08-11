package equipment_api.entity;

/**
 * Estado del ciclo de vida de una reserva.
 *
 * ACTIVE    -> la reserva ocupa la franja horaria y bloquea nuevas reservas.
 * CANCELLED -> la reserva fue cancelada; libera la franja pero se conserva
 *              en la base de datos para no perder el historico (lo usan las
 *              estadisticas de equipos mas solicitados).
 */
public enum ReservationStatus {
    ACTIVE,
    CANCELLED
}