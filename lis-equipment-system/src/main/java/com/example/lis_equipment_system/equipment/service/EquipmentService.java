package com.example.lis_equipment_system.equipment.service;

import com.example.lis_equipment_system.equipment.dto.EquipmentUpdateRequest;
import com.example.lis_equipment_system.equipment.dto.EquipmentRequest;
import com.example.lis_equipment_system.equipment.dto.EquipmentResponse;
import com.example.lis_equipment_system.equipment.entity.enumerator.EquipmentCategory;
import com.example.lis_equipment_system.equipment.entity.enumerator.EquipmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface EquipmentService {

    EquipmentResponse create(EquipmentRequest request);

    EquipmentResponse update(Long id, EquipmentUpdateRequest request);

    EquipmentResponse findById(Long id);

    Page<EquipmentResponse> findAll(EquipmentCategory category, EquipmentStatus status, Pageable pageable);
}