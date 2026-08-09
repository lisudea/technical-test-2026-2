package com.lis.reservas.common.exception;

/**
 * Raised when a request fails a domain validation rule that is not covered
 * by the Jakarta Bean Validation annotations (e.g. a reservation window
 * whose start is not before its end, is in the past, or exceeds the
 * configured maximum duration).
 *
 * <p>Phase 3 maps this to HTTP {@code 400 Bad Request} via the RFC 7807
 * advice. It is distinct from {@link RecursoNoEncontradoException} (404),
 * {@link ReservaEnConflictoException} (409, overlapping reservation) and
 * {@link EquipoNoDisponibleException} (409, equipment state conflict).
 */
public class ValidacionException extends RuntimeException {

    public ValidacionException(String message) {
        super(message);
    }
}
