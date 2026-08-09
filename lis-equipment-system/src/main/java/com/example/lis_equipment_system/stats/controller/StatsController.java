package com.example.lis_equipment_system.stats.controller;

import com.example.lis_equipment_system.stats.dto.CancellationRateResponse;
import com.example.lis_equipment_system.stats.dto.CategoryReservationResponse;
import com.example.lis_equipment_system.stats.dto.TopEquipmentResponse;
import com.example.lis_equipment_system.stats.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/top-equipment")
    public ResponseEntity<List<TopEquipmentResponse>> topRequestedEquipment() {
        return ResponseEntity.ok(statsService.getTopRequestedEquipment());
    }
    @GetMapping("/reservations-by-category")
    public ResponseEntity<List<CategoryReservationResponse>> reservationsByCategory() {
        return ResponseEntity.ok(statsService.getReservationsByCategory());
    }

    @GetMapping("/cancellation-rate")
    public ResponseEntity<CancellationRateResponse> cancellationRate() {
        return ResponseEntity.ok(statsService.getCancellationRate());
    }
}