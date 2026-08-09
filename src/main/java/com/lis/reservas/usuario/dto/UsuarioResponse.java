package com.lis.reservas.usuario.dto;

/**
 * Minimal user profile projection. Used by the usuario mapper and (in Phase 4)
 * by the auth {@code /auth/me} endpoint via {@link PerfilResponse}.
 *
 * @param idUsuario the database-generated identity
 * @param nombre    the display name
 * @param correo    the UNIQUE natural key (identity)
 */
public record UsuarioResponse(Integer idUsuario, String nombre, String correo) {
}