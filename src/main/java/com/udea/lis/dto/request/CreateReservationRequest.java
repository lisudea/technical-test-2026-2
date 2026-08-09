package com.udea.lis.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request to create a new reservation")
public class CreateReservationRequest {

    @NotNull(message = "Equipment ID is required")
    @Schema(description = "ID of the equipment to reserve", example = "1")
    private Long equipmentId;

    @NotNull(message = "User ID is required")
    @Schema(description = "ID of the user making the reservation", example = "1")
    private Long userId;

    @NotNull(message = "Start time is required")
    @Schema(description = "Reservation start date and time", example = "2026-08-10T10:00:00")
    private LocalDateTime startTime;

    @NotNull(message = "End time is required")
    @Schema(description = "Reservation end date and time", example = "2026-08-10T12:00:00")
    private LocalDateTime endTime;
}
