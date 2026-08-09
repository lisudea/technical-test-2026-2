package com.udea.lis.dto.response;

import com.udea.lis.entity.ReservationStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Reservation information response")
public class ReservationResponse {

    @Schema(description = "Reservation ID", example = "1")
    private Long id;

    @Schema(description = "Reserved equipment summary")
    private EquipmentSummary equipment;

    @Schema(description = "User who made the reservation summary")
    private UserSummary user;

    @Schema(description = "Reservation start date and time")
    private LocalDateTime startTime;

    @Schema(description = "Reservation end date and time")
    private LocalDateTime endTime;

    @Schema(description = "Reservation creation timestamp")
    private LocalDateTime createdAt;

    @Schema(description = "Reservation status", example = "ACTIVE")
    private ReservationStatus status;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Schema(description = "Equipment summary embedded in reservation")
    public static class EquipmentSummary {

        @Schema(description = "Equipment ID", example = "1")
        private Long id;

        @Schema(description = "Equipment name", example = "Arduino Uno R3")
        private String name;

        @Schema(description = "Serial number", example = "SN-ARD-001")
        private String serialNumber;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Schema(description = "User summary embedded in reservation")
    public static class UserSummary {

        @Schema(description = "User ID", example = "1")
        private Long id;

        @Schema(description = "User name", example = "Satoru Gojo")
        private String name;

        @Schema(description = "User email", example = "satoru.gojo@udea.edu.co")
        private String email;
    }
}
