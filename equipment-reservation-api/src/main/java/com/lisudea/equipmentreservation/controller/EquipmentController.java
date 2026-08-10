package com.lisudea.equipmentreservation.controller;

import com.lisudea.equipmentreservation.dto.request.CreateEquipmentRequest;
import com.lisudea.equipmentreservation.dto.request.UpdateEquipmentRequest;
import com.lisudea.equipmentreservation.dto.response.*;
import com.lisudea.equipmentreservation.service.EquipmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;

@RestController
@RequestMapping("/api/equipment")
public class EquipmentController {

    private final EquipmentService equipmentService;

    public EquipmentController(EquipmentService equipmentService) {
        this.equipmentService = equipmentService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EquipmentResponse create(@Valid @RequestBody CreateEquipmentRequest request) {
        return equipmentService.create(request);
    }

    @PutMapping("/{id}")
    public EquipmentResponse update(@PathVariable Long id, @Valid @RequestBody UpdateEquipmentRequest request) {
        return equipmentService.update(id, request);
    }

    @GetMapping
    public PageResponse<EquipmentSummaryResponse> list(@RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "10") int size,
                                                      @RequestParam(required = false) Long categoryId,
                                                      @RequestParam(required = false) Long operationalStatusId) {
        return equipmentService.list(page, size, categoryId, operationalStatusId);
    }

    @GetMapping("/{id}/availability")
    public AvailabilityResponse availability(@PathVariable Long id,
                                             @RequestParam OffsetDateTime startAt,
                                             @RequestParam OffsetDateTime endAt) {
        return equipmentService.getAvailability(id, startAt, endAt);
    }
}
