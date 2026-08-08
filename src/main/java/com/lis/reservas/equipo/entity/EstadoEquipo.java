package com.lis.reservas.equipo.entity;

/**
 * Global lifecycle state of a piece of equipment.
 *
 * <ul>
 *   <li>{@link #DISPONIBLE} — available for reservation.</li>
 *   <li>{@link #MANTENIMIENTO} — out of service for maintenance; cannot be reserved.</li>
 *   <li>{@link #BAJA} — decommissioned; permanently unavailable.</li>
 * </ul>
 *
 * <p>Punctual occupancy of an available equipo during a time window is NOT
 * stored here — it is derived from active reservations whose window overlaps
 * "now". This avoids keeping the persisted state in sync with the reservas
 * table manually.
 */
public enum EstadoEquipo {
    DISPONIBLE,
    MANTENIMIENTO,
    BAJA
}
