package com.lis.reservas.estadisticas.dto;

/**
 * One row of the Top-N most-reserved equipment ranking. Excludes cancelled
 * reservations (the backing {@code estadisticas_equipos_top} VIEW already
 * filters {@code estado <> 'cancelada'}).
 *
 * @param idEquipo     equipment id
 * @param nombre       equipment name
 * @param categoria    category name (denormalized)
 * @param totalReservas count of non-cancelled reservations
 */
public record EquipoTopResponse(Integer idEquipo, String nombre, String categoria, long totalReservas) {
}