package co.edu.udea.lis.lisource.audit.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.Iterator;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class AuditSanitizer {
    private static final Set<String> SENSITIVE_PARTS = Set.of(
            "password", "contrasena", "contraseña", "token", "secret", "authorization",
            "cookie", "credential", "apikey", "api_key", "jwt");
    private final ObjectMapper mapper;

    public AuditSanitizer(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public JsonNode sanitize(Object value) {
        if (value == null) return null;
        return sanitizeNode(mapper.valueToTree(value));
    }

    private JsonNode sanitizeNode(JsonNode node) {
        if (node == null || node.isNull() || node.isValueNode()) return node;
        if (node.isArray()) {
            ArrayNode result = mapper.createArrayNode();
            node.forEach(child -> result.add(sanitizeNode(child)));
            return result;
        }
        ObjectNode result = mapper.createObjectNode();
        Iterator<String> names = node.fieldNames();
        while (names.hasNext()) {
            String name = names.next();
            if (!sensitive(name)) result.set(name, sanitizeNode(node.get(name)));
        }
        return result;
    }

    private boolean sensitive(String key) {
        String normalized = key.replaceAll("[^A-Za-z0-9_]", "").toLowerCase(Locale.ROOT);
        return SENSITIVE_PARTS.stream().anyMatch(normalized::contains);
    }
}

