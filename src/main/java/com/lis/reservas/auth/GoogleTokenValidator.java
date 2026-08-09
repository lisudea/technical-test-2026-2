package com.lis.reservas.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lis.reservas.common.exception.DominioNoAutorizadoException;
import com.lis.reservas.common.exception.ValidacionException;
import com.lis.reservas.config.ReservasProperties;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Validates the Google id_token received by {@code POST /api/v1/auth/google}.
 *
 * <p>This Phase 4 implementation is intentionally lightweight: it decodes the
 * id_token payload (a base64url JSON object) WITHOUT verifying the Google
 * signature — the real signature check against Google's public keys is left as
 * a placeholder (the {@code google-api-client} dependency is not on the
 * classpath yet). What IS enforced now is what matters for the contract:
 *
 * <ul>
 *   <li>Google SSO must be enabled ({@code reservas.auth.google.enabled}).</li>
 *   <li>The token must be non-blank and well-formed.</li>
 *   <li>{@code email_verified} must be true when present.</li>
 *   <li>The email must belong to the configured allowed domain
 *       (default {@code udea.edu.co}).</li>
 * </ul>
 *
 * <p>Swapping the payload decoding for a real
 * {@code GoogleIdTokenVerifier} later only requires replacing
 * {@link #extractUserInfo}; the domain and toggle checks stay.
 */
@Component
public class GoogleTokenValidator {

    private final ReservasProperties properties;
    private final ObjectMapper objectMapper;

    public GoogleTokenValidator(ReservasProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    /**
     * Verify the id_token and return the resolved user identity.
     *
     * @throws DominioNoAutorizadoException if Google SSO is disabled, the
     *         email is not verified, or the email is outside the allowed domain.
     * @throws ValidacionException if the token is blank, malformed or undecodable.
     */
    public GoogleUserInfo verify(String idTokenString) {
        if (!isGoogleEnabled()) {
            throw new DominioNoAutorizadoException("Google SSO no configurado");
        }
        if (idTokenString == null || idTokenString.isBlank()) {
            throw new ValidacionException("id_token es requerido");
        }
        GoogleUserInfo info = extractUserInfo(idTokenString);
        if (info.email() == null || info.email().isBlank()) {
            throw new ValidacionException("El id_token no contiene email");
        }
        if (!isDomainAllowed(info.email())) {
            throw new DominioNoAutorizadoException(
                    "Correo fuera del dominio permitido: " + info.email());
        }
        return info;
    }

    private boolean isGoogleEnabled() {
        return properties.auth() != null
                && properties.auth().google() != null
                && properties.auth().google().enabled();
    }

    boolean isDomainAllowed(String email) {
        String domain = properties.auth().google().allowedDomain();
        if (domain == null || domain.isBlank()) {
            return false;
        }
        return email != null && email.endsWith("@" + domain);
    }

    /**
     * Decode the JWT payload segment and read the {@code email}/{@code name}
     * claims. Signature verification is deliberately skipped (placeholder).
     */
    GoogleUserInfo extractUserInfo(String idTokenString) {
        String[] parts = idTokenString.split("\\.");
        if (parts.length < 2) {
            throw new ValidacionException("id_token malformado");
        }
        String payloadJson;
        try {
            payloadJson = new String(
                    Base64.getUrlDecoder().decode(parts[1]),
                    StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            throw new ValidacionException("id_token malformado");
        }
        try {
            JsonNode node = objectMapper.readTree(payloadJson);
            if (node.has("email_verified") && !node.get("email_verified").asBoolean()) {
                throw new DominioNoAutorizadoException("Email no verificado por Google");
            }
            String email = node.has("email") ? node.get("email").asText(null) : null;
            String nombre = node.has("name") && !node.get("name").isNull()
                    ? node.get("name").asText()
                    : (node.has("given_name") ? node.get("given_name").asText() : email);
            return new GoogleUserInfo(email, nombre);
        } catch (DominioNoAutorizadoException e) {
            throw e;
        } catch (Exception e) {
            throw new ValidacionException("id_token no pudo ser decodificado");
        }
    }

    /** Resolved identity extracted from a verified Google id_token. */
    public record GoogleUserInfo(String email, String nombre) {
    }
}
