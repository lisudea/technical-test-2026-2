package com.udea.lis.dto.response;

import com.udea.lis.entity.EquipmentCategory;
import com.udea.lis.entity.EquipmentStatus;
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
@Schema(description = "Equipment information response")
public class EquipmentResponse {

    @Schema(description = "Equipment ID", example = "1")
    private Long id;

    @Schema(description = "Equipment name", example = "Arduino Uno R3")
    private String name;

    @Schema(description = "Serial number", example = "SN-ARD-001")
    private String serialNumber;

    @Schema(description = "MAC address", example = "AA:BB:CC:DD:EE:FF")
    private String macAddress;

    @Schema(description = "Equipment category", example = "MICROCONTROLLERS")
    private EquipmentCategory category;

    @Schema(description = "Current status", example = "AVAILABLE")
    private EquipmentStatus status;

    @Schema(description = "Creation timestamp")
    private LocalDateTime createdAt;

    @Schema(description = "Last update timestamp")
    private LocalDateTime updatedAt;
}
