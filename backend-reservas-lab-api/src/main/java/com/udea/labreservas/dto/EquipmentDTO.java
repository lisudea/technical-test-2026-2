package com.udea.labreservas.dto;

import com.udea.labreservas.entity.EquipmentStatus;

public record EquipmentDTO(
        Integer equipmentId,
        String equipmentName,
        String macNumber,
        EquipmentStatus status,
        Integer categoryId,
        String categoryName
) {
}