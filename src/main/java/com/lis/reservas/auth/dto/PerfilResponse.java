package com.lis.reservas.auth.dto;

import com.lis.reservas.usuario.entity.Rol;

/**
 * Response body for {@code GET /api/v1/auth/me}. Returns the authenticated
 * user's profile derived from the JWT claims / upserted usuario row.
 *
 * <p>The {@code rol} lets the frontend decide which consoles to render. It is
 * a display hint only — every privileged endpoint re-checks the role
 * server-side, so a tampered client gains nothing.
 *
 * @param nombre the user's display name
 * @param correo the user's email (identity)
 * @param rol    the user's authority level
 */
public record PerfilResponse(String nombre, String correo, Rol rol) {
}
