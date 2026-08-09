package com.udea.lis.controller;

import com.udea.lis.dto.request.CreateReservationRequest;
import com.udea.lis.dto.response.ReservationResponse;
import com.udea.lis.service.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Reservation", description = "Reservation management endpoints")
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping("/api/reservations")
    @Operation(summary = "Create a new reservation")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Reservation created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request body or dates",
                    content = @Content(schema = @Schema(implementation = com.udea.lis.dto.response.ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Equipment or user not found",
                    content = @Content(schema = @Schema(implementation = com.udea.lis.dto.response.ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Equipment already reserved in the requested period",
                    content = @Content(schema = @Schema(implementation = com.udea.lis.dto.response.ErrorResponse.class)))
    })
    public ResponseEntity<ReservationResponse> create(
            @Valid @RequestBody CreateReservationRequest request) {
        ReservationResponse response = reservationService.createReservation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/api/reservations")
    @Operation(summary = "List all reservations")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of all reservations")
    })
    public ResponseEntity<List<ReservationResponse>> getAll() {
        List<ReservationResponse> responses = reservationService.getAllReservations();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/api/reservations/{id}")
    @Operation(summary = "Get reservation by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Reservation found"),
            @ApiResponse(responseCode = "404", description = "Reservation not found",
                    content = @Content(schema = @Schema(implementation = com.udea.lis.dto.response.ErrorResponse.class)))
    })
    public ResponseEntity<ReservationResponse> getById(@PathVariable Long id) {
        ReservationResponse response = reservationService.getReservation(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/equipment/{equipmentId}/reservations")
    @Operation(summary = "Get reservations for a specific equipment")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of reservations for the equipment"),
            @ApiResponse(responseCode = "404", description = "Equipment not found",
                    content = @Content(schema = @Schema(implementation = com.udea.lis.dto.response.ErrorResponse.class)))
    })
    public ResponseEntity<List<ReservationResponse>> getByEquipment(@PathVariable Long equipmentId) {
        List<ReservationResponse> responses = reservationService.getReservationsByEquipmentId(equipmentId);
        return ResponseEntity.ok(responses);
    }

    @DeleteMapping("/api/reservations/{id}")
    @Operation(summary = "Cancel a reservation")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Reservation cancelled successfully"),
            @ApiResponse(responseCode = "404", description = "Reservation not found",
                    content = @Content(schema = @Schema(implementation = com.udea.lis.dto.response.ErrorResponse.class)))
    })
    public ResponseEntity<Void> cancel(@PathVariable Long id) {
        reservationService.cancelReservation(id);
        return ResponseEntity.noContent().build();
    }
}
