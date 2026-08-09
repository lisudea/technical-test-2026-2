package com.udea.lis.dto.request;

import com.udea.lis.entity.EquipmentCategory;
import com.udea.lis.entity.EquipmentStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request to update an existing equipment")
public class UpdateEquipmentRequest {

    @NotBlank(message = "Name is required")
    @Schema(description = "Equipment name", example = "Arduino Uno R3")
    private String name;

    @NotBlank(message = "Serial number is required")
    @Schema(description = "Unique serial number", example = "SN-ARD-001")
    private String serialNumber;

    @Schema(description = "MAC address (optional, unique if provided)", example = "AA:BB:CC:DD:EE:FF")
    private String macAddress;

    @NotNull(message = "Category is required")
    @Schema(description = "Equipment category", example = "MICROCONTROLLERS")
    private EquipmentCategory category;

    @NotNull(message = "Status is required")
    @Schema(description = "Equipment status", example = "AVAILABLE")
    private EquipmentStatus status;
}
