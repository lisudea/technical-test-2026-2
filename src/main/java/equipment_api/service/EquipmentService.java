package equipment_api.service;

import equipment_api.entity.Equipment;
import equipment_api.entity.EquipmentCategory;
import equipment_api.entity.EquipmentStatus;
import equipment_api.exception.EquipmentNotFoundException;
import equipment_api.repository.EquipmentRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;

    public EquipmentService(EquipmentRepository equipmentRepository) {
        this.equipmentRepository = equipmentRepository;
    }

    public Equipment createEquipment(Equipment equipment) {
        return equipmentRepository.save(equipment);
    }

    public Page<Equipment> getAllEquipment(
            EquipmentCategory category,
            EquipmentStatus status,
            Pageable pageable
    ) {

        if (category != null && status != null) {
            return equipmentRepository.findByCategoryAndStatus(
                    category,
                    status,
                    pageable
            );
        }

        if (category != null) {
            return equipmentRepository.findByCategory(
                    category,
                    pageable
            );
        }

        if (status != null) {
            return equipmentRepository.findByStatus(
                    status,
                    pageable
            );
        }

        return equipmentRepository.findAll(pageable);
    }

    public Equipment getEquipmentById(Long id) {
        return equipmentRepository.findById(id)
            .orElseThrow(() -> new EquipmentNotFoundException(id));
    }

    public Equipment updateEquipment(Long id, Equipment updatedEquipment) {

        Equipment existingEquipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new EquipmentNotFoundException(id));

        existingEquipment.setName(updatedEquipment.getName());
        existingEquipment.setSerialNumber(updatedEquipment.getSerialNumber());
        existingEquipment.setCategory(updatedEquipment.getCategory());
        existingEquipment.setStatus(updatedEquipment.getStatus());

        return equipmentRepository.save(existingEquipment);
    }
}