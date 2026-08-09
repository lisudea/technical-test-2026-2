package co.edu.udea.lis.lisource.auth.api;

import co.edu.udea.lis.lisource.auth.application.AuthService;
import co.edu.udea.lis.lisource.auth.application.RefreshCookieService;
import co.edu.udea.lis.lisource.shared.security.SecurityPrincipal;
import co.edu.udea.lis.lisource.shared.util.RequestMetadata;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService service;
    private final RefreshCookieService cookies;

    public AuthController(AuthService service, RefreshCookieService cookies) {
        this.service = service;
        this.cookies = cookies;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest input,
                                               HttpServletRequest request) {
        return response(service.login(input.email(), input.password(), RequestMetadata.from(request)));
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> google(@Valid @RequestBody GoogleRequest input,
                                                HttpServletRequest request) {
        return response(service.loginGoogle(input.credential(), RequestMetadata.from(request)));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @CookieValue(name = RefreshCookieService.COOKIE_NAME, required = false) String refreshToken,
            HttpServletRequest request) {
        return response(service.refresh(refreshToken, RequestMetadata.from(request)));
    }

    @PostMapping("/select-role")
    public ResponseEntity<AuthResponse> selectRole(@Valid @RequestBody SelectRoleRequest input,
                                                    HttpServletRequest request) {
        return response(service.selectRole(input.selectionToken(), input.role(), RequestMetadata.from(request)));
    }

    @PostMapping("/switch-role")
    public ResponseEntity<AuthResponse> switchRole(
            @CookieValue(name = RefreshCookieService.COOKIE_NAME, required = false) String refreshToken,
            @Valid @RequestBody SwitchRoleRequest input,
            HttpServletRequest request) {
        return response(service.switchRole(SecurityPrincipal.userId(), refreshToken, input.role(),
                RequestMetadata.from(request)));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = RefreshCookieService.COOKIE_NAME, required = false) String refreshToken) {
        service.logout(refreshToken, SecurityPrincipal.userId());
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, cookies.clear().toString()).build();
    }

    @PostMapping("/logout-all")
    public ResponseEntity<Map<String, Integer>> logoutAll() {
        int count = service.logoutAll(SecurityPrincipal.userId());
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookies.clear().toString())
                .body(Map.of("revokedSessions", count));
    }

    @PostMapping("/forgot-password")
    public Map<String, String> forgot(@Valid @RequestBody ForgotPasswordRequest input,
                                      HttpServletRequest request) {
        service.forgotPassword(input.email(), RequestMetadata.from(request));
        return Map.of("message", "If an account is associated with that email, recovery instructions will be sent.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> reset(@Valid @RequestBody ResetPasswordRequest input) {
        service.resetPassword(input.token(), input.newPassword());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/set-password")
    public ResponseEntity<Void> setPassword(@Valid @RequestBody SetPasswordRequest input) {
        service.setPassword(SecurityPrincipal.userId(), input.newPassword());
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, cookies.clear().toString()).build();
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest input) {
        service.changePassword(SecurityPrincipal.userId(), input.oldPassword(), input.newPassword());
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, cookies.clear().toString()).build();
    }

    private ResponseEntity<AuthResponse> response(AuthService.AuthResult result) {
        ResponseEntity.BodyBuilder response = ResponseEntity.ok();
        if (result.refreshToken() != null && result.refreshExpiresAt() != null) {
            response.header(HttpHeaders.SET_COOKIE,
                    cookies.create(result.refreshToken(), result.refreshExpiresAt()).toString());
        }
        return response.body(result.response());
    }

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}
    public record GoogleRequest(@NotBlank String credential) {}
    public record SelectRoleRequest(@NotBlank String selectionToken, @NotBlank String role) {}
    public record SwitchRoleRequest(@NotBlank String role) {}
    public record ForgotPasswordRequest(@NotBlank @Email String email) {}
    public record ResetPasswordRequest(@NotBlank String token, @NotBlank @Size(max = 128) String newPassword) {}
    public record SetPasswordRequest(@NotBlank @Size(max = 128) String newPassword) {}
    public record ChangePasswordRequest(@NotBlank String oldPassword, @NotBlank @Size(max = 128) String newPassword) {}
}
