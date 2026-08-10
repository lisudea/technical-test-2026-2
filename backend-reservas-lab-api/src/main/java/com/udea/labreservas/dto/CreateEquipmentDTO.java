package com.udea.labreservas.dto;

import com.udea.labreservas.entity.EquipmentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateEquipmentDTO(
        @NotBlank(message = "El nombre del equipo es obligatorio")
        String equipmentName,

        @NotBlank(message = "El numero de serie o MAC es obligatorio")
        String macNumber,

        @NotNull(message = "El estado del equipo es obligatorio")
        EquipmentStatus status,

        @NotNull(message = "La categoria del equipo es obligatoria")
        Integer categoryId
) {
}