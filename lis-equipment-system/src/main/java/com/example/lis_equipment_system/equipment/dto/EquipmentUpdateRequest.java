package com.example.lis_equipment_system.equipment.dto;

import com.example.lis_equipment_system.equipment.entity.enumerator.EquipmentCategory;
import com.example.lis_equipment_system.equipment.entity.enumerator.EquipmentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentUpdateRequest {

    @NotBlank(message = "El nombre del equipo es obligatorio")
    private String name;

    @NotNull(message = "La categoría es obligatoria")
    private EquipmentCategory category;

    @NotNull(message = "El estado es obligatorio")
    private EquipmentStatus status;
}