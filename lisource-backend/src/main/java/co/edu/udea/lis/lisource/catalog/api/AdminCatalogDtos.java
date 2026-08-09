package co.edu.udea.lis.lisource.catalog.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AdminCatalogDtos {
    private AdminCatalogDtos() {}
    public record CatalogAdminItem(int id, String code, String name, String description, boolean active) {}
    public record CatalogInput(
            @NotBlank @Pattern(regexp="[A-Z0-9_]{1,40}") String code,
            @NotBlank @Size(max=100) String name,
            @Size(max=255) String description) {}
    public record StatusChange(@NotBlank @Pattern(regexp="ACTIVO|INACTIVO") String status) {}
}
