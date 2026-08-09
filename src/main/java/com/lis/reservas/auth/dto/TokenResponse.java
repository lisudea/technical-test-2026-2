package com.lis.reservas.auth.dto;

/**
 * Response body for {@code POST /api/v1/auth/google} on success.
 *
 * @param token     the signed JWT issued by this service
 * @param tipo      the Authorization scheme — always {@code "Bearer"}
 * @param expiresIn the token lifetime in seconds
 */
public record TokenResponse(String token, String tipo, long expiresIn) {
}