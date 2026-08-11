package com.lis.reservas.sancion.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.lis.reservas.sancion.entity.EstadoSancion;
import com.lis.reservas.sancion.entity.OrigenSancion;

import java.time.LocalDateTime;

/**
 * Response projection for a sanction. The usuario association is flattened
 * to id/nombre/correo so clients never receive nested entity graphs.
 *
 * <p>{@code vigente} is computed server-side rather than left to the client:
 * a sanction is in force only when it is ACTIVA <em>and</em> its window has
 * not elapsed, and every client would otherwise have to re-derive that from
 * the raw dates — each with its own timezone bug.
 *
 * @param idSancion                database identity
 * @param idUsuario                sanctioned user id
 * @param usuarioNombre            sanctioned user display name
 * @param correoUsuario            sanctioned user email
 * @param motivo                   why the sanction was raised
 * @param fechaInicio              window start
 * @param fechaFin                 window end
 * @param estado                   ACTIVA or LEVANTADA
 * @param origen                   MANUAL or AUTOMATICA
 * @param vigente                  whether it blocks reservations right now
 * @param idReserva                triggering reservation (AUTOMATICA only)
 * @param creadaPorNombre          who raised it
 * @param levantadaPorNombre       who lifted it early, if anyone
 * @param fechaLevantamiento       when it was lifted early
 * @param observacionLevantamiento why it was lifted early
 * @param fechaCreacion            audit timestamp
 */
public record SancionResponse(
        Long idSancion,
        Integer idUsuario,
        String usuarioNombre,
        String correoUsuario,
        String motivo,
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") LocalDateTime fechaInicio,
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") LocalDateTime fechaFin,
        EstadoSancion estado,
        OrigenSancion origen,
        boolean vigente,
        Long idReserva,
        String creadaPorNombre,
        String levantadaPorNombre,
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") LocalDateTime fechaLevantamiento,
        String observacionLevantamiento,
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") LocalDateTime fechaCreacion) {
}
