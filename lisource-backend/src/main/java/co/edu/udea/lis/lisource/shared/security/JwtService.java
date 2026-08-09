package co.edu.udea.lis.lisource.shared.security;

import co.edu.udea.lis.lisource.configuration.application.ConfigurationService;
import co.edu.udea.lis.lisource.shared.config.AppProperties;
import co.edu.udea.lis.lisource.user.domain.UserAccount;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.List;
import java.util.Set;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final JwtEncoder encoder;
    private final ConfigurationService configuration;
    private final AppProperties properties;
    private final Clock clock;
    private final JwtDecoder selectionJwtDecoder;

    public JwtService(JwtEncoder encoder, ConfigurationService configuration,
                      AppProperties properties, Clock clock,
                      @Qualifier("selectionJwtDecoder") JwtDecoder selectionJwtDecoder) {
        this.encoder = encoder;
        this.configuration = configuration;
        this.properties = properties;
        this.clock = clock;
        this.selectionJwtDecoder = selectionJwtDecoder;
    }

    public AccessToken issue(UserAccount user, String activeRole, long sessionId) {
        Instant issuedAt = Instant.now(clock);
        int minutes = configuration.integerOr(ConfigurationService.ACCESS_MINUTES, 15);
        Instant expiresAt = issuedAt.plus(Duration.ofMinutes(minutes));
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(properties.jwt().issuer())
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .subject(Long.toString(user.id()))
                .id(UUID.randomUUID().toString())
                .claim("email", user.email())
                .claim("tokenUse", "ACCESS")
                .claim("activeRole", activeRole)
                .claim("sid", sessionId)
                .claim("roles", List.of(activeRole))
                .claim("availableRoles", user.roles().stream().sorted().toList())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).type("JWT").build();
        return new AccessToken(encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue(),
                Duration.between(issuedAt, expiresAt).toSeconds());
    }

    public String issueRoleSelection(UserAccount user) {
        Instant issuedAt = Instant.now(clock);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(properties.jwt().issuer())
                .issuedAt(issuedAt)
                .expiresAt(issuedAt.plus(Duration.ofMinutes(5)))
                .subject(Long.toString(user.id()))
                .id(UUID.randomUUID().toString())
                .claim("email", user.email())
                .claim("tokenUse", "ROLE_SELECTION")
                .claim("availableRoles", user.roles().stream().sorted().toList())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).type("JWT").build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    public RoleSelectionToken decodeRoleSelection(String value) {
        try {
            Jwt decoded = selectionJwtDecoder.decode(value);
            if (!"ROLE_SELECTION".equals(decoded.getClaimAsString("tokenUse"))) {
                throw new IllegalArgumentException("Unexpected token use");
            }
            long userId = Long.parseLong(decoded.getSubject());
            List<String> values = decoded.getClaimAsStringList("availableRoles");
            return new RoleSelectionToken(userId, values == null ? Set.of() : Set.copyOf(values));
        } catch (JwtException | IllegalArgumentException exception) {
            throw new co.edu.udea.lis.lisource.shared.exception.AppException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED,
                    co.edu.udea.lis.lisource.shared.exception.ErrorCode.ROLE_NOT_AVAILABLE,
                    "Role selection token is invalid or expired.");
        }
    }

    public record AccessToken(String value, long expiresInSeconds) {}
    public record RoleSelectionToken(long userId, Set<String> availableRoles) {}
}
