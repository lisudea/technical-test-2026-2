package com.lis.reservas.auth.dto;

/**
 * Response body for {@code GET /api/v1/auth/me}. Returns the authenticated
 * user's profile derived from the JWT claims / upserted usuario row.
 *
 * @param nombre the user's display name
 * @param correo the user's email (identity)
 */
public record PerfilResponse(String nombre, String correo) {
}