package com.example.lis_equipment_system.reservation.controller;

import com.example.lis_equipment_system.reservation.dto.ReservationRequest;
import com.example.lis_equipment_system.reservation.dto.ReservationResponse;
import com.example.lis_equipment_system.reservation.service.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reservation")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping
    public ResponseEntity<ReservationResponse> create(@Valid @RequestBody ReservationRequest request,
                                                        @AuthenticationPrincipal Jwt jwt) {
        ReservationResponse response = reservationService.create(request, jwt.getSubject());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{id}/cancellation")
    public ResponseEntity<Void> cancel(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        reservationService.cancel(id, jwt.getSubject());
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<Page<ReservationResponse>> findAll(
            @RequestParam(required = false) Long equipmentId,
            Pageable pageable) {
        return ResponseEntity.ok(reservationService.findAll(equipmentId, pageable));
    }
}