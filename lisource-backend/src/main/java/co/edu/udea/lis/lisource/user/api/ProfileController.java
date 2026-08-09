package co.edu.udea.lis.lisource.user.api;

import co.edu.udea.lis.lisource.shared.security.SecurityPrincipal;
import co.edu.udea.lis.lisource.user.application.ProfileService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
public class ProfileController {
    private final ProfileService service;

    public ProfileController(ProfileService service) {
        this.service = service;
    }

    @GetMapping
    public UserResponse get() {
        return service.get(SecurityPrincipal.userId(), SecurityPrincipal.activeRole());
    }

    @PatchMapping
    public UserResponse update(@Valid @RequestBody UpdateProfileRequest request) {
        return service.update(SecurityPrincipal.userId(), SecurityPrincipal.activeRole(),
                request.firstName(), request.lastName(), request.languageCode());
    }

    public record UpdateProfileRequest(
            @Size(max = 120) String firstName,
            @Size(max = 120) String lastName,
            @Size(max = 10) String languageCode) {}
}
