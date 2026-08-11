package com.lis.reservas.common.exception;

/**
 * Raised when a sanctioned user tries to create a reservation.
 *
 * <p>Mapped to HTTP {@code 403 Forbidden} by the RFC 7807 advice, not 409:
 * nothing about the requested time window is in conflict, the caller simply
 * is not allowed to book right now. A 409 would send clients hunting for
 * another slot that does not exist.
 *
 * <p>The message names the reason and the end date, because a bare "you are
 * sanctioned" leaves the user with nothing to act on.
 */
public class UsuarioSancionadoException extends RuntimeException {

    public UsuarioSancionadoException(String message) {
        super(message);
    }
}
