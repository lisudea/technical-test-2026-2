package com.example.lis_equipment_system.stats.dto;

public record CancellationRateResponse(
        long totalReservations,
        long activeReservations,
        long cancelledReservations,
        double cancellationRatePercentage
) {
}