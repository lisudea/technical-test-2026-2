package com.udea.lis.service;

import com.udea.lis.dto.request.CreateEquipmentRequest;
import com.udea.lis.dto.request.UpdateEquipmentRequest;
import com.udea.lis.dto.response.EquipmentResponse;
import com.udea.lis.entity.Equipment;
import com.udea.lis.entity.EquipmentCategory;
import com.udea.lis.entity.EquipmentStatus;
import com.udea.lis.exception.DuplicateResourceException;
import com.udea.lis.exception.ResourceNotFoundException;
import com.udea.lis.mapper.EquipmentMapper;
import com.udea.lis.repository.EquipmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final EquipmentMapper equipmentMapper;

    @Transactional
    public EquipmentResponse createEquipment(CreateEquipmentRequest request) {
        validateUniqueSerialNumber(request.getSerialNumber(), null);
        if (request.getMacAddress() != null && !request.getMacAddress().isBlank()) {
            validateUniqueMacAddress(request.getMacAddress(), null);
        }

        Equipment equipment = equipmentMapper.toEntity(request);
        equipment = equipmentRepository.save(equipment);
        return equipmentMapper.toResponse(equipment);
    }

    public EquipmentResponse getEquipment(Long id) {
        Equipment equipment = findEquipmentById(id);
        return equipmentMapper.toResponse(equipment);
    }

    public Page<EquipmentResponse> getAllEquipment(EquipmentCategory category, EquipmentStatus status,
                                                    Pageable pageable) {
        Specification<Equipment> spec = null;

        if (category != null) {
            spec = hasCategory(category);
        }
        if (status != null) {
            spec = spec != null ? spec.and(hasStatus(status)) : hasStatus(status);
        }

        if (spec != null) {
            return equipmentRepository.findAll(spec, pageable)
                    .map(equipmentMapper::toResponse);
        }
        return equipmentRepository.findAll(pageable)
                .map(equipmentMapper::toResponse);
    }

    @Transactional
    public EquipmentResponse updateEquipment(Long id, UpdateEquipmentRequest request) {
        Equipment equipment = findEquipmentById(id);

        validateUniqueSerialNumber(request.getSerialNumber(), id);
        if (request.getMacAddress() != null && !request.getMacAddress().isBlank()) {
            validateUniqueMacAddress(request.getMacAddress(), id);
        }

        equipmentMapper.updateEntity(equipment, request);
        equipment = equipmentRepository.save(equipment);
        return equipmentMapper.toResponse(equipment);
    }

    public Equipment findEquipmentById(Long id) {
        return equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment", id));
    }

    private void validateUniqueSerialNumber(String serialNumber, Long excludeId) {
        boolean exists = excludeId != null
                ? equipmentRepository.existsBySerialNumberAndIdNot(serialNumber, excludeId)
                : equipmentRepository.existsBySerialNumber(serialNumber);
        if (exists) {
            throw new DuplicateResourceException("Serial number '" + serialNumber + "' already exists");
        }
    }

    private void validateUniqueMacAddress(String macAddress, Long excludeId) {
        boolean exists = excludeId != null
                ? equipmentRepository.existsByMacAddressAndIdNot(macAddress, excludeId)
                : equipmentRepository.existsByMacAddress(macAddress);
        if (exists) {
            throw new DuplicateResourceException("MAC address '" + macAddress + "' already exists");
        }
    }

    private Specification<Equipment> hasCategory(EquipmentCategory category) {
        return (root, query, cb) -> cb.equal(root.get("category"), category);
    }

    private Specification<Equipment> hasStatus(EquipmentStatus status) {
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }
}
