package co.edu.udea.lis.lisource.auth.application;

import co.edu.udea.lis.lisource.shared.config.AppProperties;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

@Service
public class RefreshCookieService {
    public static final String COOKIE_NAME = "lisource_refresh";
    private final AppProperties properties;
    private final Clock clock;

    public RefreshCookieService(AppProperties properties, Clock clock) {
        this.properties = properties;
        this.clock = clock;
    }

    public ResponseCookie create(String token, Instant expiresAt) {
        long seconds = Math.max(0, Duration.between(Instant.now(clock), expiresAt).toSeconds());
        return base().value(token).maxAge(seconds).build();
    }

    public ResponseCookie clear() {
        return base().value("").maxAge(Duration.ZERO).build();
    }

    private ResponseCookie.ResponseCookieBuilder base() {
        return ResponseCookie.from(COOKIE_NAME)
                .httpOnly(true)
                .secure(properties.cookie().secure())
                .sameSite(properties.cookie().sameSite())
                .path("/api/v1/auth");
    }
}

