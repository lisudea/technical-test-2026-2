package com.lis.reservas.reserva.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.lis.reservas.reserva.entity.EstadoPrestamo;
import com.lis.reservas.reserva.entity.EstadoReserva;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;

/**
 * Response projection for a reservation. The equipo and usuario are
 * denormalized to {@code equipoNombre} / {@code usuarioNombre} /
 * {@code correoUsuario} so clients do not receive nested entity graphs.
 *
 * <p>The loan block ({@code estadoPrestamo} onwards) describes the physical
 * hand-over, which is a separate lifecycle from {@code estado} — see
 * {@link EstadoPrestamo}. It is carried on the same projection so the
 * auxiliar console can render a booking and its loan state in one row
 * without a second round trip.
 *
 * @param idReserva      database identity
 * @param idEquipo       reserved equipment id
 * @param equipoNombre   reserved equipment name
 * @param idUsuario      reserving user id
 * @param usuarioNombre  reserving user display name
 * @param correoUsuario  reserving user email
 * @param fechaHoraInicio reservation window start
 * @param fechaHoraFin   reservation window end
 * @param estado         booking lifecycle state
 * @param motivo         optional reason
 * @param fechaCreacion  creation timestamp
 * @param fechaCancelacion cancellation timestamp (null unless cancelled)
 * @param estadoPrestamo hand-over lifecycle state
 * @param fechaEntrega   when the equipment left the counter
 * @param fechaDevolucion when it came back
 * @param entregadoPorNombre auxiliar who handed it over
 * @param recibidoPorNombre  auxiliar who took it back
 * @param observacionesPrestamo condition notes from the counter
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
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") LocalDateTime fechaCancelacion,
        EstadoPrestamo estadoPrestamo,
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") LocalDateTime fechaEntrega,
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") LocalDateTime fechaDevolucion,
        String entregadoPorNombre,
        String recibidoPorNombre,
        String observacionesPrestamo) {
}
