package co.edu.lab.sistemas.dto;

import co.edu.lab.sistemas.enums.EstadoFisico;

import java.time.LocalDateTime;

// DTO de respuesta para equipos de laboratorio.
public record EquipoResponseDTO(
        Long id,
        String nombre,
        String identificador,
        CategoriaResumenDTO categoria,
        EstadoFisico estadoFisico,
        LocalDateTime fechaRegistro,
        LocalDateTime fechaActualizacion
) {}