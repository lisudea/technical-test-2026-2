package com.udea.lis.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Top equipment statistics entry")
public class TopEquipmentResponse {

    @Schema(description = "Equipment ID", example = "1")
    private Long equipmentId;

    @Schema(description = "Equipment name", example = "Arduino Uno R3")
    private String equipmentName;

    @Schema(description = "Serial number", example = "SN-ARD-001")
    private String serialNumber;

    @Schema(description = "Total number of reservations (active + cancelled)", example = "15")
    private Long reservationCount;
}
