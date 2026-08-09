package com.lis.reservas.equipo.dto;

import com.lis.reservas.equipo.entity.EstadoEquipo;
import jakarta.validation.constraints.NotNull;

/**
 * Request body for {@code PATCH /api/v1/equipos/{id}/estado}. Only the
 * {@code estado} field is accepted; partial estado transitions are the
 * one exception to the full-equipo update contract.
 *
 * @param estado the new global lifecycle state; must not be null
 */
public record EstadoPatchRequest(@NotNull EstadoEquipo estado) {
}