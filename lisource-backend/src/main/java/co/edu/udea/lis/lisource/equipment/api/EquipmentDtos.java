package co.edu.udea.lis.lisource.equipment.api;

import jakarta.validation.constraints.*;
import java.time.Instant;

public final class EquipmentDtos {
    private EquipmentDtos() {}

    public record CatalogRef(int id, String code, String name) {}
    public record StatusRef(String code, String name) {}

    public record EquipmentResponse(
            long id,
            String inventoryCode,
            String name,
            String description,
            String serialNumber,
            String macAddress,
            String imageUrl,
            CatalogRef category,
            CatalogRef location,
            StatusRef operationalStatus,
            String visualStatus,
            Instant createdAt,
            Instant updatedAt) {}

    public record EquipmentInput(
            @NotBlank @Size(max = 60) String inventoryCode,
            @NotBlank @Size(max = 120) String name,
            String description,
            @Size(max = 120) String serialNumber,
            @Size(max = 17) String macAddress,
            @Size(max = 500) String imageUrl,
            @NotNull Integer categoryId,
            Integer locationId,
            @NotBlank String operationalStatus) {}

    public record ChangeStatusRequest(@NotBlank String operationalStatus) {}
}

