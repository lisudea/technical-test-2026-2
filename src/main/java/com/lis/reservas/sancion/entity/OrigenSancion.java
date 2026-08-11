package com.lis.reservas.sancion.entity;

/**
 * How a {@link Sancion} came to exist.
 *
 * <ul>
 *   <li>{@link #MANUAL} — an ADMIN raised it deliberately.</li>
 *   <li>{@link #AUTOMATICA} — the loan desk raised it as the consequence of
 *       an unclaimed reservation. These carry the triggering
 *       {@code idReserva} so the user can be shown exactly what caused it.</li>
 * </ul>
 */
public enum OrigenSancion {
    MANUAL,
    AUTOMATICA
}
