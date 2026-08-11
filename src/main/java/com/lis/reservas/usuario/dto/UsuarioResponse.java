package com.lis.reservas.usuario.dto;

import com.lis.reservas.usuario.entity.Rol;

import java.time.LocalDateTime;

/**
 * User profile projection, used by the auth {@code /auth/me} endpoint and by
 * the ADMIN user-administration listing.
 *
 * @param idUsuario     the database-generated identity
 * @param nombre        the display name
 * @param correo        the UNIQUE natural key (identity)
 * @param rol           the authority level
 * @param fechaRegistro when the user first signed in
 */
public record UsuarioResponse(
        Integer idUsuario,
        String nombre,
        String correo,
        Rol rol,
        LocalDateTime fechaRegistro) {
}
