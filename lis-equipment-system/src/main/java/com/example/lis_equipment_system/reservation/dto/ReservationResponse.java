package com.example.lis_equipment_system.reservation.dto;

import com.example.lis_equipment_system.reservation.entity.enumerator.ReservationStatus;

import java.time.LocalDateTime;

public record ReservationResponse(
        Long id,
        Long equipmentId,
        String equipmentName,
        String userName,
        String userEmail,
        LocalDateTime dateStartTime,
        LocalDateTime dateEndTime,
        ReservationStatus status,
        LocalDateTime creationDate
) {
}