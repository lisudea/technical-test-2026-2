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
import com.udea.lis.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final ReservationRepository reservationRepository;
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
        EquipmentResponse response = equipmentMapper.toResponse(equipment);
        response.setStatus(resolveStatus(equipment));
        return response;
    }

    public Page<EquipmentResponse> getAllEquipment(EquipmentCategory category, EquipmentStatus status,
                                                    Pageable pageable) {
        Specification<Equipment> spec = category != null ? hasCategory(category) : null;

        List<Equipment> equipmentList = spec != null
                ? equipmentRepository.findAll(spec)
                : equipmentRepository.findAll();

        List<EquipmentResponse> filtered = equipmentList.stream()
                .map(equipment -> {
                    EquipmentResponse response = equipmentMapper.toResponse(equipment);
                    response.setStatus(resolveStatus(equipment));
                    return response;
                })
                .filter(response -> status == null || response.getStatus() == status)
                .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        List<EquipmentResponse> pageContent = start < filtered.size()
                ? filtered.subList(start, end)
                : List.of();

        return new PageImpl<>(pageContent, pageable, filtered.size());
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

    private EquipmentStatus resolveStatus(Equipment equipment) {
        if (equipment.getStatus() == EquipmentStatus.MAINTENANCE) {
            return EquipmentStatus.MAINTENANCE;
        }
        if (reservationRepository.existsActiveReservationForEquipment(equipment.getId())) {
            return EquipmentStatus.RESERVED;
        }
        return EquipmentStatus.AVAILABLE;
    }
}
