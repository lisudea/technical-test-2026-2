package com.lis.reservas.auth;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Test helper that builds fake Google id_token strings (a three-part JWT
 * whose payload is a base64url JSON object) so {@link GoogleTokenValidator}
 * can be exercised without the real Google signature-verification library.
 */
final class FakeGoogleIdToken {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private FakeGoogleIdToken() {
    }

    static String build(String email, String nombre, Boolean emailVerified) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("iss", "https://accounts.google.com");
            payload.put("sub", "1234567890");
            payload.put("azp", "test-client");
            if (email != null) {
                payload.put("email", email);
            }
            if (nombre != null) {
                payload.put("name", nombre);
            }
            if (emailVerified != null) {
                payload.put("email_verified", emailVerified);
            }

            String header = base64url("{\"alg\":\"RS256\",\"typ\":\"JWT\"}");
            String body = base64url(MAPPER.writeValueAsString(payload));
            String signature = base64url("fake-signature");
            return header + "." + body + "." + signature;
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    static String malformed() {
        return "not-a-valid-jwt";
    }

    private static String base64url(String json) {
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(json.getBytes(StandardCharsets.UTF_8));
    }
}
