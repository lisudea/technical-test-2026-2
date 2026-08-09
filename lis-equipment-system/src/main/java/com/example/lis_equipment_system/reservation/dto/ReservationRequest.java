package com.example.lis_equipment_system.reservation.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record ReservationRequest(

        @NotNull(message = "El id del equipo es obligatorio")
        Long equipmentId,

        @NotNull(message = "La fecha de inicio es obligatoria")
        LocalDateTime dateStartTime,

        @NotNull(message = "La fecha de fin es obligatoria")
        LocalDateTime dateEndTime
) {
}