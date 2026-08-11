package com.lis.reservas.sancion.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request body for {@code POST /api/v1/sanciones} (ADMIN only).
 *
 * <p>The duration is expressed in whole days rather than an end date: it is
 * what an administrator actually decides ("a week off"), and it removes the
 * whole class of bugs where a client sends an end date in the past or in a
 * different timezone. The service turns it into a concrete window starting
 * now.
 *
 * @param idUsuario the sanctioned user (required)
 * @param motivo    why — shown to the user when a reservation is refused
 * @param dias      length in days, 1..365
 */
public record SancionCreateRequest(
        @NotNull Integer idUsuario,
        @NotBlank @Size(max = 255) String motivo,
        @NotNull @Min(1) @Max(365) Integer dias) {
}
