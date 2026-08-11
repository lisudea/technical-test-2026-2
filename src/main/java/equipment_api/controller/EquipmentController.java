package equipment_api.controller;

import equipment_api.entity.Equipment;
import equipment_api.entity.EquipmentCategory;
import equipment_api.entity.EquipmentStatus;
import equipment_api.service.EquipmentService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@RestController
@RequestMapping("/api/equipment")
public class EquipmentController {

    private final EquipmentService equipmentService;

    public EquipmentController(EquipmentService equipmentService) {
        this.equipmentService = equipmentService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Equipment createEquipment(@Valid @RequestBody Equipment equipment) {
        return equipmentService.createEquipment(equipment);
    }

    /**
     * Listado avanzado: paginado (`page`, `size`, `sort`) y filtrable por
     * `category` y/o `status`. Los filtros son opcionales y combinables.
     */
    @GetMapping
    public Page<Equipment> getAllEquipment(
        @RequestParam(required = false) EquipmentCategory category,
        @RequestParam(required = false) EquipmentStatus status,
        Pageable pageable
    ) {
        return equipmentService.getAllEquipment(
            category,
            status,
            pageable
        );
    }

    @GetMapping("/{id}")
        public Equipment getEquipmentById(@PathVariable Long id) {
        return equipmentService.getEquipmentById(id);
    }

    @PutMapping("/{id}")
    public Equipment updateEquipment(
            @PathVariable Long id,
            @Valid @RequestBody Equipment equipment) {

        return equipmentService.updateEquipment(id, equipment);
    }
}

