package com.lis.reservas.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for {@link JwtTokenProvider}. Pure unit (no Spring context):
 * the provider is constructed directly and {@code init()} is invoked to
 * materialize the signing key (mimicking {@code @PostConstruct}).
 */
class JwtTokenProviderTest {

    private static final String SECRET =
            "test-secret-must-be-at-least-32-bytes-long-xxxxx";

    private JwtTokenProvider provider;
    private SecretKey key;

    @BeforeEach
    void setUp() {
        provider = new JwtTokenProvider(SECRET, 30);
        provider.init();
        key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    void generateTokenProducesNonEmptyCompactJwt() {
        String token = provider.generateToken("juan@udea.edu.co", "Juan Perez");

        assertThat(token).isNotNull().isNotEmpty();
        assertThat(token.split("\\.")).hasSize(3);
    }

    @Test
    void getCorreoFromTokenReturnsSubjectClaim() {
        String token = provider.generateToken("juan@udea.edu.co", "Juan Perez");

        assertThat(provider.getCorreoFromToken(token)).isEqualTo("juan@udea.edu.co");
    }

    @Test
    void tokenCarriesNombreClaim() {
        String token = provider.generateToken("juan@udea.edu.co", "Juan Perez");

        Claims claims = Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).getPayload();
        assertThat(claims.get("nombre")).isEqualTo("Juan Perez");
    }

    @Test
    void validateTokenAcceptsValidToken() {
        String token = provider.generateToken("juan@udea.edu.co", "Juan Perez");

        assertThat(provider.validateToken(token)).isTrue();
    }

    @Test
    void validateTokenRejectsTamperedToken() {
        String token = provider.generateToken("juan@udea.edu.co", "Juan Perez");
        String tampered = token.substring(0, token.length() - 5) + "XXXXX";

        assertThat(provider.validateToken(tampered)).isFalse();
    }

    @Test
    void validateTokenRejectsExpiredToken() {
        Date past = new Date(System.currentTimeMillis() - 10_000);
        String expired = Jwts.builder()
                .subject("juan@udea.edu.co")
                .claim("nombre", "Juan")
                .issuedAt(new Date(System.currentTimeMillis() - 20_000))
                .expiration(past)
                .signWith(key, Jwts.SIG.HS256)
                .compact();

        assertThat(provider.validateToken(expired)).isFalse();
    }

    @Test
    void validateTokenRejectsBlankToken() {
        assertThat(provider.validateToken("")).isFalse();
        assertThat(provider.validateToken("   ")).isFalse();
    }

    @Test
    void expirationSecondsMatchesConfiguredMinutes() {
        assertThat(provider.expirationSeconds())
                .isEqualTo(Duration.ofMinutes(30).toSeconds());
    }
}
