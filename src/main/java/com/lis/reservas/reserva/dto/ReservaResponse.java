package com.lis.reservas.reserva.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.lis.reservas.reserva.entity.EstadoReserva;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;

/**
 * Response projection for a reservation. The equipo and usuario are
 * denormalized to {@code equipoNombre} / {@code usuarioNombre} /
 * {@code correoUsuario} so clients do not receive nested entity graphs.
 *
 * @param idReserva      database identity
 * @param idEquipo       reserved equipment id
 * @param equipoNombre   reserved equipment name
 * @param idUsuario      reserving user id
 * @param usuarioNombre  reserving user display name
 * @param correoUsuario  reserving user email
 * @param fechaHoraInicio reservation window start
 * @param fechaHoraFin   reservation window end
 * @param estado         reservation lifecycle state
 * @param motivo         optional reason
 * @param fechaCreacion  creation timestamp
 * @param fechaCancelacion cancellation timestamp (null unless cancelled)
 */
public record ReservaResponse(
        Long idReserva,
        Integer idEquipo,
        String equipoNombre,
        Integer idUsuario,
        String usuarioNombre,
        String correoUsuario,
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX") OffsetDateTime fechaHoraInicio,
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ssXXX") OffsetDateTime fechaHoraFin,
        EstadoReserva estado,
        String motivo,
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") LocalDateTime fechaCreacion,
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") LocalDateTime fechaCancelacion) {
}