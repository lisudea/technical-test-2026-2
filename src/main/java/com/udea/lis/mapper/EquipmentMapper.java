package com.udea.lis.mapper;

import com.udea.lis.dto.request.CreateEquipmentRequest;
import com.udea.lis.dto.request.UpdateEquipmentRequest;
import com.udea.lis.dto.response.EquipmentResponse;
import com.udea.lis.entity.Equipment;
import com.udea.lis.entity.EquipmentStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class EquipmentMapper {

    public Equipment toEntity(CreateEquipmentRequest request) {
        return Equipment.builder()
                .name(request.getName())
                .serialNumber(request.getSerialNumber())
                .macAddress(request.getMacAddress())
                .category(request.getCategory())
                .status(request.getStatus() != null ? request.getStatus() : EquipmentStatus.AVAILABLE)
                .build();
    }

    public void updateEntity(Equipment equipment, UpdateEquipmentRequest request) {
        equipment.setName(request.getName());
        equipment.setSerialNumber(request.getSerialNumber());
        equipment.setMacAddress(request.getMacAddress());
        equipment.setCategory(request.getCategory());
        equipment.setStatus(request.getStatus());
        equipment.setUpdatedAt(LocalDateTime.now());
    }

    public EquipmentResponse toResponse(Equipment equipment) {
        return EquipmentResponse.builder()
                .id(equipment.getId())
                .name(equipment.getName())
                .serialNumber(equipment.getSerialNumber())
                .macAddress(equipment.getMacAddress())
                .category(equipment.getCategory())
                .status(equipment.getStatus())
                .createdAt(equipment.getCreatedAt())
                .updatedAt(equipment.getUpdatedAt())
                .build();
    }
}
