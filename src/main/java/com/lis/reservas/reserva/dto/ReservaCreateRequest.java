package com.lis.reservas.reserva.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;

/**
 * Request body for {@code POST /api/v1/reservas}.
 *
 * <p>Dates carry an explicit offset ({@code America/Bogota} UTC-5); when a
 * caller omits the offset, Jackson attaches the configured default zone.
 * Validation of the time window (start &lt; end, not in the past, within the
 * configurable max duration, equipo {@code disponible}) happens in
 * {@code ReservaService} BEFORE the {@code FOR UPDATE} lock is acquired.
 *
 * @param nombreUsuario  the reserving user's display name (required)
 * @param correoUsuario  the reserving user's email (required, well-formed)
 * @param idEquipo       the equipment to reserve (required)
 * @param fechaHoraInicio reservation window start (required, ISO-8601 with offset)
 * @param fechaHoraFin   reservation window end (required, ISO-8601 with offset)
 * @param motivo         optional reason for the reservation
 */
public record ReservaCreateRequest(
        @NotBlank String nombreUsuario,
        @NotBlank @Email String correoUsuario,
        @NotNull Integer idEquipo,
        @NotNull @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX") OffsetDateTime fechaHoraInicio,
        @NotNull @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX") OffsetDateTime fechaHoraFin,
        String motivo) {
}