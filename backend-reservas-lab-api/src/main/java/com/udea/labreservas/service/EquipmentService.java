package com.udea.labreservas.service;

import com.udea.labreservas.dto.CreateEquipmentDTO;
import com.udea.labreservas.dto.EquipmentDTO;
import com.udea.labreservas.dto.UpdateEquipmentDTO;
import com.udea.labreservas.entity.EquipmentCategory;
import com.udea.labreservas.entity.EquipmentStatus;
import com.udea.labreservas.entity.LabEquipment;
import com.udea.labreservas.entity.ReservationStatus;
import com.udea.labreservas.exception.ResourceNotFoundException;
import com.udea.labreservas.mapping.EquipmentMapper;
import com.udea.labreservas.repository.LabEquipmentRepository;
import com.udea.labreservas.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EquipmentService {

    private final LabEquipmentRepository equipmentRepository;
    private final ReservationRepository reservationRepository;
    private final EquipmentCategoryService categoryService;
    private final EquipmentMapper equipmentMapper;

    @Transactional
    public EquipmentDTO create(CreateEquipmentDTO dto) {
        EquipmentCategory category = categoryService.requireById(dto.categoryId());

        LabEquipment equipment = equipmentMapper.toEntity(dto, category);
        EquipmentStatus status = dto.status();
        equipment.setStatus(status != null ? status : EquipmentStatus.DISPONIBLE);

        LabEquipment saved = equipmentRepository.save(equipment);
        return equipmentMapper.toDto(saved);
    }

    @Transactional
    public EquipmentDTO update(Integer equipmentId, UpdateEquipmentDTO dto) {
        LabEquipment equipment = requireById(equipmentId);

        if (dto.getEquipmentName() != null && !dto.getEquipmentName().isBlank()) {
            equipment.setEquipmentName(dto.getEquipmentName().trim());
        }
        if (dto.getMacNumber() != null && !dto.getMacNumber().isBlank()) {
            equipment.setMacNumber(dto.getMacNumber().trim());
        }
        if (dto.getStatus() != null) {
            equipment.setStatus(dto.getStatus());
        }
        if (dto.getCategoryId() != null) {
            equipment.setCategory(categoryService.requireById(dto.getCategoryId()));
        }

        return equipmentMapper.toDto(equipmentRepository.save(equipment));
    }

    @Transactional
    public void delete(Integer equipmentId) {
        LabEquipment equipment = requireById(equipmentId);
        long activeReservations = reservationRepository.countActiveByEquipment(
                equipmentId, ReservationStatus.CREADA);
        if (activeReservations > 0) {
            throw new ResourceNotFoundException(
                    "No es posible eliminar el equipo porque tiene reservas activas asociadas");
        }
        equipmentRepository.delete(equipment);
    }

    @Transactional(readOnly = true)
    public EquipmentDTO findById(Integer equipmentId) {
        return equipmentMapper.toDto(requireById(equipmentId));
    }

    @Transactional(readOnly = true)
    public Page<EquipmentDTO> findAll(Integer categoryId, EquipmentStatus status, Pageable pageable) {
        Specification<LabEquipment> specification = Specification
                .where(byCategory(categoryId))
                .and(byStatus(status));

        return equipmentRepository.findAll(specification, pageable).map(equipmentMapper::toDto);
    }

    @Transactional(readOnly = true)
    public LabEquipment requireById(Integer equipmentId) {
        return equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No existe el equipo con id " + equipmentId));
    }

    private Specification<LabEquipment> byCategory(Integer categoryId) {
        return (root, query, cb) -> categoryId == null
                ? cb.conjunction()
                : cb.equal(root.get("category").get("categoryId"), categoryId);
    }

    private Specification<LabEquipment> byStatus(EquipmentStatus status) {
        return (root, query, cb) -> status == null
                ? cb.conjunction()
                : cb.equal(root.get("status"), status);
    }
}