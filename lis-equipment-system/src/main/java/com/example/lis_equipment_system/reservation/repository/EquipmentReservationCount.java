package com.example.lis_equipment_system.reservation.repository;

import com.example.lis_equipment_system.equipment.entity.enumerator.EquipmentCategory;

public interface EquipmentReservationCount {
    Long getEquipmentId();
    String getEquipmentName();
    EquipmentCategory getCategory();
    Long getReservationCount();
}