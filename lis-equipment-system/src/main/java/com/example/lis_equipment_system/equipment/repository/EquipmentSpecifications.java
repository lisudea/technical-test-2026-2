package com.example.lis_equipment_system.equipment.repository;

import com.example.lis_equipment_system.equipment.entity.Equipment;
import com.example.lis_equipment_system.equipment.entity.enumerator.EquipmentCategory;
import com.example.lis_equipment_system.equipment.entity.enumerator.EquipmentStatus;
import org.springframework.data.jpa.domain.Specification;

public class EquipmentSpecifications {

    private EquipmentSpecifications() {
    }
    
    public static Specification<Equipment> hasCategory(EquipmentCategory category) {
        return (root, query, cb) ->
            category == null ? null : cb.equal(root.get("category"), category);
    }

    public static Specification<Equipment> hasStatus(EquipmentStatus status) {
        return (root, query, cb) ->
            status == null ? null : cb.equal(root.get("status"), status);
    }
}
