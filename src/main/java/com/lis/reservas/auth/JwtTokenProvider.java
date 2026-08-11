package com.lis.reservas.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import com.lis.reservas.usuario.entity.Rol;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;

/**
 * Issues and validates the signed JWTs used to authenticate stateless API
 * clients.
 *
 * <p>Tokens are HMAC-SHA256 (HS256) signed with the configurable
 * {@code auth.jwt.secret}, carry the user's {@code correo} as the JWT
 * {@code subject} plus {@code nombre} and {@code rol} claims, and expire after
 * {@code auth.jwt.expiration-minutes} (default 30 minutes). There is no
 * refresh token: clients re-authenticate with Google when the JWT expires.
 *
 * <p>The signing {@link SecretKey} is materialized once in {@link #init()} from
 * the UTF-8 bytes of the configured secret (which MUST be at least 32 bytes
 * long to satisfy HS256).
 */
@Component
public class JwtTokenProvider {

    /** Name of the custom claim carrying the user's {@link Rol}. */
    public static final String ROL_CLAIM = "rol";

    private final String secret;
    private final long expirationMinutes;
    private SecretKey key;

    public JwtTokenProvider(@Value("${auth.jwt.secret}") String secret,
                            @Value("${auth.jwt.expiration-minutes:30}") long expirationMinutes) {
        this.secret = secret;
        this.expirationMinutes = expirationMinutes;
    }

    @PostConstruct
    void init() {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Build a signed JWT for the given identity. {@code correo} becomes the
     * {@code subject}; {@code nombre} is carried as a claim so downstream
     * code can read it without a DB lookup.
     */
    public String generateToken(String correo, String nombre, Rol rol) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + expirationSeconds() * 1000L);
        return Jwts.builder()
                .subject(correo)
                .claim("nombre", nombre)
                .claim(ROL_CLAIM, (rol == null ? Rol.ESTUDIANTE : rol).name())
                .issuedAt(now)
                .expiration(exp)
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    /**
     * Extract the {@code subject} (the correo) from a signed token.
     */
    public String getCorreoFromToken(String token) {
        return parse(token).getSubject();
    }

    /**
     * Extract the {@code rol} claim.
     *
     * <p>Falls back to {@link Rol#ESTUDIANTE} for tokens issued before roles
     * existed, or carrying a role name this build does not know. Failing
     * open on privilege would be a vulnerability; failing down to the
     * least-privileged role is the safe default.
     */
    public Rol getRolFromToken(String token) {
        return Rol.parseOr(parse(token).get(ROL_CLAIM, String.class), Rol.ESTUDIANTE);
    }

    /**
     * True iff the signature verifies and the token has not expired.
     */
    public boolean validateToken(String token) {
        try {
            parse(token);
            return true;
        } catch (ExpiredJwtException e) {
            return false;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Configured lifetime in seconds (used by {@link AuthService} to populate
     * the {@code expiresIn} field of {@link com.lis.reservas.auth.dto.TokenResponse}).
     */
    public long expirationSeconds() {
        return Duration.ofMinutes(expirationMinutes).toSeconds();
    }

    private Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
