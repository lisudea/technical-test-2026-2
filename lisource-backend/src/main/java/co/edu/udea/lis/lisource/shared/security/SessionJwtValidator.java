package co.edu.udea.lis.lisource.shared.security;

import co.edu.udea.lis.lisource.auth.infrastructure.AuthRepository;
import co.edu.udea.lis.lisource.configuration.application.ConfigurationService;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
public class SessionJwtValidator implements OAuth2TokenValidator<Jwt> {
    private static final OAuth2Error INVALID_SESSION = new OAuth2Error(
            "invalid_token", "The token session is inactive or revoked", null);

    private final AuthRepository sessions;
    private final ConfigurationService configuration;
    private final Clock clock;

    public SessionJwtValidator(AuthRepository sessions, ConfigurationService configuration, Clock clock) {
        this.sessions = sessions;
        this.configuration = configuration;
        this.clock = clock;
    }

    @Override
    public OAuth2TokenValidatorResult validate(Jwt token) {
        try {
            long userId = Long.parseLong(token.getSubject());
            Number sessionClaim = token.getClaim("sid");
            if (sessionClaim == null) return failure();
            Instant now = Instant.now(clock);
            int configuredHours = configuration.integerOr(ConfigurationService.SESSION_IDLE_HOURS, 24);
            Duration idleTimeout = Duration.ofHours(configuredHours > 0 ? configuredHours : 24);
            return sessions.isActiveSession(userId, sessionClaim.longValue(), now, now.minus(idleTimeout))
                    ? OAuth2TokenValidatorResult.success() : failure();
        } catch (RuntimeException exception) {
            return failure();
        }
    }

    private OAuth2TokenValidatorResult failure() {
        return OAuth2TokenValidatorResult.failure(INVALID_SESSION);
    }
}
