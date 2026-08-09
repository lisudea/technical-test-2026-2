package com.lis.reservas.common.exception;

/**
 * Raised by {@code ReservaService} when a new reservation window overlaps an
 * existing {@code ACTIVA} reservation on the same equipo.
 *
 * <p>The conflict is detected <em>after</em> acquiring a {@code FOR UPDATE}
 * lock (see {@code ReservaRepository#findConflictingForUpdate}) so two
 * concurrent creators targeting the same slot cannot both succeed. Phase 3
 * maps this to HTTP {@code 409 Conflict} via the RFC 7807 advice.
 */
public class ReservaEnConflictoException extends RuntimeException {

    public ReservaEnConflictoException(String message) {
        super(message);
    }
}
