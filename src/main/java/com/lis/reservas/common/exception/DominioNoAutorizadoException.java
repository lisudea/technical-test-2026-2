package com.lis.reservas.common.exception;

/**
 * Raised during authentication when the verified email does not belong to
 * the authorized institutional domain (e.g. {@code udea.edu.co}).
 *
 * <p>The LIS reservation system is restricted to members of the
 * Universidad de Antioquia community; a successfully verified Google id
 * token whose email is outside the allowed domain is rejected. Phase 3 maps
 * this to HTTP {@code 403 Forbidden} via the RFC 7807 advice — the identity
 * is known but not authorized.
 */
public class DominioNoAutorizadoException extends RuntimeException {

    public DominioNoAutorizadoException(String message) {
        super(message);
    }
}
