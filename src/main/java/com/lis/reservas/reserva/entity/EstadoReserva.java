package com.lis.reservas.reserva.entity;

/**
 * Lifecycle state of a reservation.
 *
 * <ul>
 *   <li>{@link #ACTIVA} — confirmed and pending use.</li>
 *   <li>{@link #CANCELADA} — soft-deleted by the user; kept for history/stats
 *       (excluded from overlap checks and from Top-N statistics).</li>
 *   <li>{@link #COMPLETADA} — the time window has passed; no longer occupying
 *       the equipo but still counted in statistics.</li>
 * </ul>
 *
 * <p>Only {@code ACTIVA} reservations participate in overlap/conflict
 * validation. A cancelled reservation is never deleted so audit trails and
 * honest statistics are preserved.
 */
public enum EstadoReserva {
    ACTIVA,
    CANCELADA,
    COMPLETADA
}
