package com.lis.reservas.common.exception;

/**
 * Raised when a reservation targets an equipo whose global lifecycle state
 * is not {@code DISPONIBLE} (i.e. {@code MANTENIMIENTO} or {@code BAJA}).
 *
 * <p>This is a state conflict rather than a client input error, so Phase 3
 * maps it to HTTP {@code 409 Conflict} (not {@code 400}) via the RFC 7807
 * advice. The equipment is not missing (that would be
 * {@link RecursoNoEncontradoException}), it is simply not reservable right
 * now.
 */
public class EquipoNoDisponibleException extends RuntimeException {

    public EquipoNoDisponibleException(String message) {
        super(message);
    }
}
