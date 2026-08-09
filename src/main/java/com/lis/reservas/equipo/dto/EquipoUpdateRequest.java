package com.lis.reservas.equipo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request body for {@code PUT /api/v1/equipos/{id}}. A full update: the
 * required identity/name fields MUST be present. {@code macAddress} and
 * {@code descripcion} remain optional so a valid update that omits them is
 * not rejected.
 *
 * @param nombre       human-readable name (required, max 150)
 * @param numeroSerie  manufacturer serial (required on update, max 100)
 * @param macAddress   AA:BB:CC:DD:EE:FF for networking gear (max 17)
 * @param descripcion  free-text description
 * @param idCategoria  the category the equipment belongs to (required)
 */
public record EquipoUpdateRequest(
        @NotBlank @Size(max = 150) String nombre,
        @NotBlank @Size(max = 100) String numeroSerie,
        @Size(max = 17) String macAddress,
        @Size(max = 2000) String descripcion,
        @NotNull Integer idCategoria) {
}