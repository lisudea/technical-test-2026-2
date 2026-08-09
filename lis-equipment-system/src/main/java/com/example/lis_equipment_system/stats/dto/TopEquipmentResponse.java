package com.example.lis_equipment_system.stats.dto;

import com.example.lis_equipment_system.equipment.entity.enumerator.EquipmentCategory;

public record TopEquipmentResponse(
        Long equipmentId,
        String equipmentName,
        EquipmentCategory category,
        Long reservationCount
) {
}