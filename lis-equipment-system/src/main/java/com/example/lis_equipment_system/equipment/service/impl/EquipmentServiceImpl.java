package com.example.lis_equipment_system.equipment.service.impl;

import com.example.lis_equipment_system.common.exception.DuplicateResourceException;
import com.example.lis_equipment_system.common.exception.ResourceNotFoundException;
import com.example.lis_equipment_system.equipment.dto.EquipmentRequest;
import com.example.lis_equipment_system.equipment.dto.EquipmentResponse;
import com.example.lis_equipment_system.equipment.dto.EquipmentUpdateRequest;
import com.example.lis_equipment_system.equipment.entity.Equipment;
import com.example.lis_equipment_system.equipment.entity.enumerator.EquipmentCategory;
import com.example.lis_equipment_system.equipment.entity.enumerator.EquipmentStatus;
import com.example.lis_equipment_system.equipment.repository.EquipmentRepository;
import com.example.lis_equipment_system.equipment.repository.EquipmentSpecifications;
import com.example.lis_equipment_system.equipment.service.EquipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class EquipmentServiceImpl implements EquipmentService {

    private final EquipmentRepository equipmentRepository;

    @Override
    @Transactional
    public EquipmentResponse create(EquipmentRequest request) {
        if (equipmentRepository.existsByMacSerialNumber(request.getMacSerialNumber())) {
            throw new DuplicateResourceException(
                    "Ya existe un equipo con el número de serie/MAC: " + request.getMacSerialNumber());
        }

        Equipment equipment = new Equipment();
        equipment.setName(request.getName());
        equipment.setMacSerialNumber(request.getMacSerialNumber());
        equipment.setCategory(request.getCategory());
        equipment.setStatus(request.getStatus());
        equipment.setRegistrationDate(LocalDateTime.now());

        return toResponse(equipmentRepository.save(equipment));
    }

    @Override
    @Transactional
    public EquipmentResponse update(Long id, EquipmentUpdateRequest request) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipo no encontrado con id: " + id));

        equipment.setName(request.getName());
        equipment.setCategory(request.getCategory());
        equipment.setStatus(request.getStatus());
        equipment.setUpdateDate(LocalDateTime.now());

        return toResponse(equipmentRepository.save(equipment));
    }

    @Override
    public EquipmentResponse findById(Long id) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipo no encontrado con id: " + id));
        return toResponse(equipment);
    }

    @Override
    public Page<EquipmentResponse> findAll(EquipmentCategory category, EquipmentStatus status, Pageable pageable) {
        Specification<Equipment> spec = Specification
                .where(EquipmentSpecifications.hasCategory(category))
                .and(EquipmentSpecifications.hasStatus(status));

        return equipmentRepository.findAll(spec, pageable)
                .map(this::toResponse);
    }

    private EquipmentResponse toResponse(Equipment equipment) {
        return new EquipmentResponse(
                equipment.getId(),
                equipment.getName(),
                equipment.getMacSerialNumber(),
                equipment.getCategory(),
                equipment.getStatus(),
                equipment.getRegistrationDate(),
                equipment.getUpdateDate()
        );
    }
}