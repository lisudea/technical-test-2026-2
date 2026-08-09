package com.example.lis_equipment_system.equipment.dto;

import com.example.lis_equipment_system.equipment.entity.enumerator.EquipmentCategory;
import com.example.lis_equipment_system.equipment.entity.enumerator.EquipmentStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentResponse {

    private Long id;
    private String name;
    private String macSerialNumber;
    private EquipmentCategory category;
    private EquipmentStatus status;
    private LocalDateTime registrationDate;
    private LocalDateTime updateDate;
}
