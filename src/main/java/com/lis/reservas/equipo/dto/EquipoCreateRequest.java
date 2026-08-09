package com.lis.reservas.equipo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request body for {@code POST /api/v1/equipos}.
 *
 * <p>{@code numeroSerie}, {@code macAddress} and {@code descripcion} are
 * optional (some equipment — e.g. a 3D printer — has no MAC address). The
 * {@code estado} defaults to {@code disponible} on creation and is NOT
 * accepted here; use the estado patch endpoint for transitions.
 *
 * @param nombre       human-readable name (required, max 150)
 * @param numeroSerie  manufacturer serial, unique when set (max 100)
 * @param macAddress   AA:BB:CC:DD:EE:FF for networking gear (max 17)
 * @param descripcion  free-text description
 * @param idCategoria  the category the equipment belongs to (required)
 */
public record EquipoCreateRequest(
        @NotBlank @Size(max = 150) String nombre,
        @Size(max = 100) String numeroSerie,
        @Size(max = 17) String macAddress,
        @Size(max = 2000) String descripcion,
        @NotNull Integer idCategoria) {
}