package com.lis.reservas.equipo.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.lis.reservas.equipo.entity.EstadoEquipo;

import java.time.LocalDateTime;

/**
 * Response projection for a single piece of equipment. The category is
 * flattened to {@code idCategoria} + {@code categoriaNombre} so clients do
 * not receive a nested entity graph.
 *
 * @param idEquipo        database identity
 * @param nombre          human-readable name
 * @param numeroSerie     manufacturer serial (nullable)
 * @param macAddress      MAC address for networking gear (nullable)
 * @param descripcion     free-text description (nullable)
 * @param estado          global lifecycle state
 * @param idCategoria     the category id
 * @param categoriaNombre the category name (denormalized for display)
 * @param fechaCreacion     creation timestamp
 * @param fechaActualizacion last update timestamp
 */
public record EquipoResponse(
        Integer idEquipo,
        String nombre,
        String numeroSerie,
        String macAddress,
        String descripcion,
        EstadoEquipo estado,
        Integer idCategoria,
        String categoriaNombre,
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") LocalDateTime fechaCreacion,
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") LocalDateTime fechaActualizacion) {
}