package co.edu.udea.lis.lisource.shared.config;

import java.util.Arrays;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        String frontendUrl,
        String corsAllowedOrigins,
        Jwt jwt,
        String googleClientId,
        Cookie cookie,
        SchemaValidation schemaValidation,
        Storage storage) {

    public List<String> allowedOrigins() {
        if (corsAllowedOrigins == null || corsAllowedOrigins.isBlank()) {
            return List.of();
        }
        return Arrays.stream(corsAllowedOrigins.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .distinct()
                .toList();
    }

    public record Jwt(String secretBase64, String issuer) {}
    public record Cookie(boolean secure, String sameSite) {}
    public record SchemaValidation(boolean enabled) {}
    public record Storage(String url, String secretKey, String bucket) {
        public boolean configured() {
            return url != null && !url.isBlank() && secretKey != null && !secretKey.isBlank()
                    && bucket != null && !bucket.isBlank();
        }
    }
}
