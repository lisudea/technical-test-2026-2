package co.edu.udea.lis.lisource.auth.infrastructure;

import co.edu.udea.lis.lisource.auth.domain.GoogleIdentity;
import co.edu.udea.lis.lisource.auth.domain.GoogleTokenVerifier;
import co.edu.udea.lis.lisource.shared.config.AppProperties;
import co.edu.udea.lis.lisource.shared.exception.AppException;
import co.edu.udea.lis.lisource.shared.exception.ErrorCode;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Component;

@Component
public class GoogleIdTokenVerifier implements GoogleTokenVerifier {
    private static final Logger log = LoggerFactory.getLogger(GoogleIdTokenVerifier.class);
    private static final String JWKS = "https://www.googleapis.com/oauth2/v3/certs";
    private final AppProperties properties;
    private volatile JwtDecoder decoder;

    public GoogleIdTokenVerifier(AppProperties properties) {
        this.properties = properties;
    }

    @Override
    public GoogleIdentity verify(String credential) {
        String clientId = properties.googleClientId();
        if (clientId == null || clientId.isBlank()) {
            throw failure("Google Client ID is not configured", null);
        }
        try {
            Jwt jwt = decoder(clientId).decode(credential);
            Boolean verified = jwt.getClaim("email_verified");
            String email = jwt.getClaimAsString("email");
            if (!Boolean.TRUE.equals(verified) || email == null || email.isBlank()
                    || jwt.getSubject() == null || jwt.getSubject().isBlank()) {
                throw failure("Google token lacks a verified identity", null);
            }
            return new GoogleIdentity(jwt.getSubject(), email,
                    defaultName(jwt.getClaimAsString("given_name"), "Usuario"),
                    defaultName(jwt.getClaimAsString("family_name"), "Google"));
        } catch (JwtException exception) {
            throw failure("Google token verification failed", exception);
        }
    }

    private JwtDecoder decoder(String clientId) {
        JwtDecoder current = decoder;
        if (current != null) return current;
        synchronized (this) {
            if (decoder == null) {
                NimbusJwtDecoder created = NimbusJwtDecoder.withJwkSetUri(JWKS).build();
                OAuth2TokenValidator<Jwt> defaults = JwtValidators.createDefault();
                OAuth2TokenValidator<Jwt> googleClaims = jwt -> {
                    String issuer = jwt.getIssuer() == null ? null : jwt.getIssuer().toString();
                    boolean issuerOk = "https://accounts.google.com".equals(issuer) || "accounts.google.com".equals(issuer);
                    List<String> audience = jwt.getAudience();
                    if (!issuerOk || audience == null || !audience.contains(clientId)) {
                        return OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token",
                                "Invalid Google issuer or audience", null));
                    }
                    return OAuth2TokenValidatorResult.success();
                };
                created.setJwtValidator(new DelegatingOAuth2TokenValidator<>(defaults, googleClaims));
                decoder = created;
            }
            return decoder;
        }
    }

    private AppException failure(String logMessage, Exception cause) {
        if (cause == null) log.warn(logMessage); else log.warn(logMessage, cause);
        return new AppException(HttpStatus.UNAUTHORIZED, ErrorCode.GOOGLE_AUTHENTICATION_FAILED,
                "Google authentication could not be completed.");
    }

    private String defaultName(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}

