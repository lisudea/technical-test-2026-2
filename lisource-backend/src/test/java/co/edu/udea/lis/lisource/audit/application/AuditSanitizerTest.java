package co.edu.udea.lis.lisource.audit.application;

import static org.assertj.core.api.Assertions.assertThat;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.junit.jupiter.api.Test;

class AuditSanitizerTest {
    @Test
    void removesSensitiveKeysRecursively() {
        AuditSanitizer sanitizer = new AuditSanitizer(new ObjectMapper());
        var result = sanitizer.sanitize(Map.of(
                "email", "person@udea.edu.co",
                "password", "do-not-store",
                "nested", Map.of("accessToken", "jwt", "refreshToken", "refresh", "safe", "yes"),
                "secret", "hidden"));
        assertThat(result.toString()).contains("person@udea.edu.co", "safe", "yes")
                .doesNotContain("do-not-store", "jwt", "refresh", "hidden", "password", "accessToken", "secret");
    }
}

