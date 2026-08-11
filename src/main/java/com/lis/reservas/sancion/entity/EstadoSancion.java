package com.lis.reservas.sancion.entity;

/**
 * Lifecycle state of a {@link Sancion}.
 *
 * <ul>
 *   <li>{@link #ACTIVA} — the sanction stands. Whether it is currently
 *       <em>in force</em> also depends on {@code fechaFin}: an ACTIVA
 *       sanction whose window has elapsed no longer blocks anything.</li>
 *   <li>{@link #LEVANTADA} — lifted early by an ADMIN. Distinct from a
 *       naturally expired sanction, because "someone decided to forgive
 *       this" and "the clock ran out" are different facts.</li>
 * </ul>
 *
 * <p>There is deliberately no EXPIRADA state. Expiry is derived from the
 * date, so nothing has to sweep the table to keep the data honest.
 */
public enum EstadoSancion {
    ACTIVA,
    LEVANTADA
}
