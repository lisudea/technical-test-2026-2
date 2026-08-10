package com.lisudea.equipmentreservation.controller;

import com.lisudea.equipmentreservation.dto.request.CreateReservationRequest;
import com.lisudea.equipmentreservation.dto.response.PageResponse;
import com.lisudea.equipmentreservation.dto.response.ReservationResponse;
import com.lisudea.equipmentreservation.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping("/reservations")
    @ResponseStatus(HttpStatus.CREATED)
    public ReservationResponse create(@Valid @RequestBody CreateReservationRequest request) {
        return reservationService.create(request);
    }

    @PatchMapping("/reservations/{id}/cancel")
    public ReservationResponse cancel(@PathVariable Long id) {
        return reservationService.cancel(id);
    }

    @GetMapping("/reservations")
    public PageResponse<ReservationResponse> list(@RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "10") int size,
                                                   @RequestParam(required = false) String status) {
        return reservationService.list(page, size, status);
    }

    @GetMapping("/equipment/{equipmentId}/reservations")
    public PageResponse<ReservationResponse> listByEquipment(@PathVariable Long equipmentId,
                                                             @RequestParam(defaultValue = "0") int page,
                                                             @RequestParam(defaultValue = "10") int size) {
        return reservationService.listByEquipment(equipmentId, page, size);
    }
}
