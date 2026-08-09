package co.edu.udea.lis.lisource.user.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.time.Instant;
import java.util.List;

public final class AdminDtos {
    private AdminDtos() {}

    public record AdminUser(long id, String email, String firstName, String lastName,
                            String status, String language, List<String> roles,
                            Instant createdAt, Instant lastAccess) {}

    public record RoleItem(int id, String code, String name, String description, boolean active) {}

    public record StatusChange(
            @NotBlank @Pattern(regexp = "ACTIVO|INACTIVO") String status) {}

    public record RoleAssignment(boolean active) {}
}
