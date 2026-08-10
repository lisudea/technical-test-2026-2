package com.udea.labreservas.mapping;

import com.udea.labreservas.dto.CreateEquipmentDTO;
import com.udea.labreservas.dto.EquipmentDTO;
import com.udea.labreservas.entity.EquipmentCategory;
import com.udea.labreservas.entity.LabEquipment;
import org.springframework.stereotype.Component;

@Component
public class EquipmentMapper {

    public EquipmentDTO toDto(LabEquipment equipment) {
        if (equipment == null) {
            return null;
        }
        EquipmentCategory category = equipment.getCategory();

        return new EquipmentDTO(
                equipment.getEquipmentId(),
                equipment.getEquipmentName(),
                equipment.getMacNumber(),
                equipment.getStatus(),
                category != null ? category.getCategoryId() : null,
                category != null ? category.getCategoryName() : null
        );
    }

    public LabEquipment toEntity(CreateEquipmentDTO dto, EquipmentCategory category) {
        LabEquipment equipment = new LabEquipment();
        equipment.setEquipmentName(dto.equipmentName());
        equipment.setMacNumber(dto.macNumber());
        equipment.setStatus(dto.status());
        equipment.setCategory(category);
        return equipment;
    }
}