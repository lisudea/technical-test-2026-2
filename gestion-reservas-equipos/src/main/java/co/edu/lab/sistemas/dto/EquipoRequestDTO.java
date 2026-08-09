package co.edu.lab.sistemas.dto;

import co.edu.lab.sistemas.enums.EstadoFisico;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

// DTO para crear o actualizar un equipo.
public record EquipoRequestDTO(
        @NotBlank(message = "El nombre del equipo es obligatorio")
        String nombre,

        @NotBlank(message = "El identificador del equipo es obligatorio")
        String identificador,

        @NotNull(message = "La categoria es obligatoria")
        Long categoriaId,

        @NotNull(message = "El estado fisico es obligatorio")
        EstadoFisico estadoFisico
) {}