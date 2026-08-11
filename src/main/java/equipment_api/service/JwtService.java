package equipment_api.service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey secretKey;

    public JwtService(@Value("${jwt.secret}") String secret) {

        // HS384 exige una clave de al menos 384 bits (48 bytes). Fallar aqui,
        // al arrancar, es mucho mas claro que fallar al firmar el primer token.
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 48) {
            throw new IllegalStateException(
                    "JWT_SECRET debe tener al menos 48 caracteres para firmar con HS384"
            );
        }

        this.secretKey = Keys.hmacShaKeyFor(
                secret.getBytes(StandardCharsets.UTF_8)
        );
    }

    public String generateToken(OAuth2User user) {

        String email = user.getAttribute("email");
        String name = user.getAttribute("name");

        Instant now = Instant.now();
        Instant expiration = now.plusSeconds(3600);

        return Jwts.builder()
                .subject(email)
                .claim("name", name)
                .claim("role", "USER")
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiration))
                .signWith(secretKey, Jwts.SIG.HS384)
                .compact();
    }
}