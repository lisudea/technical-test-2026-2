package com.lis.reservas.common.exception;

/**
 * Raised when a referenced aggregate (categoria, equipo, reserva, usuario)
 * cannot be found by its identifier. Phase 3 maps this to HTTP {@code 404
 * Not Found} via the RFC 7807 advice.
 */
public class RecursoNoEncontradoException extends RuntimeException {

    public RecursoNoEncontradoException(String message) {
        super(message);
    }
}
