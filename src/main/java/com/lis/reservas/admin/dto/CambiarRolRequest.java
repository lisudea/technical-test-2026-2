package com.lis.reservas.admin.dto;

import com.lis.reservas.usuario.entity.Rol;
import jakarta.validation.constraints.NotNull;

/**
 * Request body for {@code PATCH /api/v1/admin/usuarios/{id}/rol}.
 *
 * <p>Typed as the {@link Rol} enum rather than a free string so an unknown
 * role name is rejected as a 400 by deserialization, long before it can be
 * mistaken for a valid one.
 *
 * @param rol the role to assign (required)
 */
public record CambiarRolRequest(@NotNull Rol rol) {
}
