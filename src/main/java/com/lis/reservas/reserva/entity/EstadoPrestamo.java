package com.lis.reservas.reserva.entity;

/**
 * Physical hand-over lifecycle of a reservation, tracked independently of
 * the booking's {@link EstadoReserva}.
 *
 * <p>The two are orthogonal on purpose. {@code estado} answers "does this
 * booking occupy the slot?" — it is what the overlap query reads.
 * {@code estadoPrestamo} answers "did the equipment physically leave the
 * counter, and did it come back?". Folding them into one column would have
 * forced every {@code estado = ACTIVA} predicate (the conflict check, the
 * statistics view, their indexes) to learn a second active value.
 *
 * <ul>
 *   <li>{@link #PENDIENTE} — booked, not yet handed over. The default.</li>
 *   <li>{@link #ENTREGADO} — an auxiliar validated the hand-over; the
 *       equipment is physically with the user.</li>
 *   <li>{@link #DEVUELTO} — returned and checked in. The booking becomes
 *       {@link EstadoReserva#COMPLETADA}.</li>
 *   <li>{@link #NO_RECLAMADO} — the user never showed up. The booking is
 *       cancelled so the slot is freed, and the configured automatic
 *       sanction may follow.</li>
 * </ul>
 *
 * <p>Legal transitions: PENDIENTE&rarr;ENTREGADO, ENTREGADO&rarr;DEVUELTO,
 * PENDIENTE&rarr;NO_RECLAMADO. Everything else is rejected by
 * {@code PrestamoService}; the terminal states are terminal.
 */
public enum EstadoPrestamo {
    PENDIENTE,
    ENTREGADO,
    DEVUELTO,
    NO_RECLAMADO
}
