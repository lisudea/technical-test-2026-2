package com.lis.backend.dto;

import com.lis.backend.entity.CategoriaEquipo;
import com.lis.backend.entity.EstadoEquipo;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record EquipoRequest(
        @NotBlank
        @Size(max = 30)
        @Pattern(regexp = "EQ-[0-9]{3,}", message = "El ID debe tener el formato EQ-001")
        @Schema(example = "EQ-015", description = "ID único visible del equipo. Formato: EQ-001, EQ-002, etc.")
        String codigo,

        @NotBlank @Size(max = 120)
        @Schema(example = "Arduino Uno", description = "Nombre del equipo")
        String nombre,

        @NotBlank @Size(max = 120)
        @Schema(example = "ARD-UNO-015", description = "Número de serie o dirección MAC")
        String numeroSerie,

        @NotNull
        @Schema(description = "Categoría del equipo", example = "MICROCONTROLADORES")
        CategoriaEquipo categoria,

        @NotNull
        @Schema(description = "Estado inicial. RESERVADO se calcula automáticamente por las reservas activas.",
                example = "DISPONIBLE")
        EstadoEquipo estado
) {}
