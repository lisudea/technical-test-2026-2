package com.udea.labreservas.dto;

import com.udea.labreservas.entity.ReservationStatus;

import java.time.LocalDateTime;

public record ReservationDTO(
        Integer reservationId,
        Integer userId,
        String userName,
        String userEmail,
        Integer equipmentId,
        String equipmentName,
        String macNumber,
        LocalDateTime startTime,
        LocalDateTime endTime,
        ReservationStatus status
) {
}