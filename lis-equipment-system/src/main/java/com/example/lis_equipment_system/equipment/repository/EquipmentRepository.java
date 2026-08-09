package com.example.lis_equipment_system.equipment.repository;

import com.example.lis_equipment_system.equipment.entity.Equipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface EquipmentRepository extends JpaRepository<Equipment, Long>, JpaSpecificationExecutor<Equipment> {

    boolean existsByMacSerialNumber(String macSerialNumber);
}