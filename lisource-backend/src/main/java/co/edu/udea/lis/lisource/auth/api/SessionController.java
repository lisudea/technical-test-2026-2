package co.edu.udea.lis.lisource.auth.api;

import co.edu.udea.lis.lisource.auth.application.AuthService;
import co.edu.udea.lis.lisource.auth.application.RefreshCookieService;
import co.edu.udea.lis.lisource.auth.infrastructure.AuthRepository;
import co.edu.udea.lis.lisource.shared.security.SecurityPrincipal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/sessions")
public class SessionController {
    private final AuthService service;
    private final RefreshCookieService cookies;

    public SessionController(AuthService service, RefreshCookieService cookies) {
        this.service = service;
        this.cookies = cookies;
    }

    @GetMapping
    public List<SessionResponse> active() {
        return service.activeSessions(SecurityPrincipal.userId(), SecurityPrincipal.sessionIdOrNull()).stream()
                .map(SessionResponse::from).toList();
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Void> revoke(@PathVariable long sessionId) {
        boolean current = java.util.Objects.equals(SecurityPrincipal.sessionIdOrNull(), sessionId);
        service.revokeSession(SecurityPrincipal.userId(), sessionId);
        if (current) {
            return ResponseEntity.noContent()
                    .header(HttpHeaders.SET_COOKIE, cookies.clear().toString()).build();
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/logout-others")
    public Map<String, Integer> logoutOthers() {
        int count = service.logoutOthers(SecurityPrincipal.userId(), SecurityPrincipal.sessionIdOrNull());
        return Map.of("revokedSessions", count);
    }

    public record SessionResponse(long id, Instant createdAt, Instant expiresAt, Instant lastUsedAt,
                                  String ipAddress, String userAgent, boolean current) {
        static SessionResponse from(AuthRepository.SessionView value) {
            return new SessionResponse(value.id(), value.createdAt(), value.expiresAt(), value.lastUsedAt(),
                    value.ipAddress(), value.userAgent(), value.current());
        }
    }
}
