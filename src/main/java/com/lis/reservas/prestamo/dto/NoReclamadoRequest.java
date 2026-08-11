package com.lis.reservas.prestamo.dto;

import jakarta.validation.constraints.Size;

/**
 * Request body for {@code POST /api/v1/prestamos/{id}/no-reclamado}.
 *
 * <p>{@code sancionar} defaults to false at the DTO level so an omitted
 * field never produces a sanction by accident; the console sends it
 * explicitly. When true, the configured
 * {@code reservas.sanciones.dias-por-no-reclamar} window is applied.
 *
 * @param observaciones why the booking is being declared unclaimed
 * @param sancionar     also raise the automatic no-show sanction
 */
public record NoReclamadoRequest(
        @Size(max = 500) String observaciones,
        boolean sancionar) {
}
