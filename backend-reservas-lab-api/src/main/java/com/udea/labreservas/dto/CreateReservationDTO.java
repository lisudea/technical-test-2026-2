package com.udea.labreservas.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;

public record CreateReservationDTO(
        @NotNull(message = "El equipo a reservar es obligatorio")
        @Positive(message = "El id del equipo debe ser un valor positivo")
        Integer equipmentId,

        @NotNull(message = "La fecha y hora de inicio es obligatoria")
        LocalDateTime startTime,

        @NotNull(message = "La fecha y hora de finalizacion es obligatoria")
        LocalDateTime endTime
) {

    public boolean isValidPeriod() {
        return startTime != null && endTime != null && startTime.isBefore(endTime);
    }
}