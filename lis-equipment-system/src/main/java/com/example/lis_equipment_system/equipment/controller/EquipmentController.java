package com.example.lis_equipment_system.equipment.controller;

import com.example.lis_equipment_system.equipment.dto.EquipmentRequest;
import com.example.lis_equipment_system.equipment.dto.EquipmentResponse;
import com.example.lis_equipment_system.equipment.dto.EquipmentUpdateRequest;
import com.example.lis_equipment_system.equipment.entity.enumerator.EquipmentCategory;
import com.example.lis_equipment_system.equipment.entity.enumerator.EquipmentStatus;
import com.example.lis_equipment_system.equipment.service.EquipmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/equipment")
@RequiredArgsConstructor
public class EquipmentController {

    private final EquipmentService equipmentService;

    @PostMapping
    public ResponseEntity<EquipmentResponse> create(@Valid @RequestBody EquipmentRequest request) {
        EquipmentResponse response = equipmentService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EquipmentResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody EquipmentUpdateRequest request) {
        return ResponseEntity.ok(equipmentService.update(id, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EquipmentResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(equipmentService.findById(id));
    }

    @GetMapping
    public ResponseEntity<Page<EquipmentResponse>> findAll(
            @RequestParam(required = false) EquipmentCategory category,
            @RequestParam(required = false) EquipmentStatus status,
            Pageable pageable) {
        return ResponseEntity.ok(equipmentService.findAll(category, status, pageable));
    }
}