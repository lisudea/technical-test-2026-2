package com.lis.reservas.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body for {@code POST /api/v1/auth/google}. The client sends the
 * Google id_token obtained after a client-side Google sign-in; the backend
 * validates it and exchanges it for a signed JWT.
 *
 * @param idToken the Google id_token (required)
 */
public record GoogleAuthRequest(@NotBlank String idToken) {
}