package co.edu.udea.lis.lisource.configuration.application;

import com.fasterxml.jackson.databind.JsonNode;
import co.edu.udea.lis.lisource.audit.application.AuditPublisher;
import co.edu.udea.lis.lisource.configuration.domain.ConfigurationValue;
import co.edu.udea.lis.lisource.configuration.infrastructure.ConfigurationRepository;
import co.edu.udea.lis.lisource.shared.exception.AppException;
import co.edu.udea.lis.lisource.shared.exception.ErrorCode;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConfigurationService {
    public static final String EMAIL_DOMAIN = "DOMINIO_CORREO_INSTITUCIONAL";
    public static final String ACCESS_MINUTES = "DURACION_ACCESS_TOKEN_MINUTOS";
    public static final String REFRESH_DAYS = "DURACION_REFRESH_TOKEN_DIAS";
    public static final String SESSION_IDLE_HOURS = "TIMEOUT_INACTIVIDAD_SESION_HORAS";
    public static final String MAX_ACTIVE_SESSIONS = "MAXIMO_SESIONES_ACTIVAS_USUARIO";
    public static final String RECOVERY_MINUTES = "DURACION_RECUPERACION_PASSWORD_MINUTOS";
    public static final String DEFAULT_PAGE_SIZE = "TAMANO_PAGINA_DEFECTO";
    public static final String MAX_PAGE_SIZE = "TAMANO_PAGINA_MAXIMO";
    public static final String DEFAULT_LANGUAGE = "IDIOMA_PREDETERMINADO";
    public static final String TOP_LIMIT = "LIMITE_TOP_EQUIPOS";

    private final ConfigurationRepository repository;
    private final AuditPublisher audit;

    public ConfigurationService(ConfigurationRepository repository, AuditPublisher audit) {
        this.repository = repository;
        this.audit = audit;
    }

    public String getString(String key) {
        JsonNode value = required(key).value();
        if (!value.isTextual() || value.textValue().isBlank()) throw invalid(key);
        return value.textValue();
    }

    public int getInteger(String key) {
        JsonNode value = required(key).value();
        if (!value.isIntegralNumber()) throw invalid(key);
        return value.intValue();
    }

    public int integerOr(String key, int fallback) {
        return repository.findActive(key).filter(value -> value.value().isIntegralNumber())
                .map(value -> value.value().intValue()).orElse(fallback);
    }

    public String stringOr(String key, String fallback) {
        return repository.findActive(key).filter(value -> value.value().isTextual())
                .map(value -> value.value().textValue()).orElse(fallback);
    }

    public List<ConfigurationValue> list() {
        return repository.findAllActive();
    }

    @Transactional
    public ConfigurationValue update(String key, JsonNode value, long actorId) {
        validate(key, value);
        ConfigurationValue previous = required(key);
        if (!repository.update(key, value)) throw notFound(key);
        ConfigurationValue updated = required(key);
        audit.success("ACTUALIZAR_CONFIGURACION", actorId, updated.id(),
                "Application configuration updated", previous.value(), updated.value());
        return updated;
    }

    private ConfigurationValue required(String key) {
        return repository.findActive(key).orElseThrow(() -> notFound(key));
    }

    private void validate(String key, JsonNode value) {
        if (key.equals("JWT_SECRET") || key.equals("DB_PASSWORD") || key.contains("SECRET")) throw invalid(key);
        switch (key) {
            case EMAIL_DOMAIN, DEFAULT_LANGUAGE -> {
                if (value == null || !value.isTextual() || value.textValue().isBlank()) throw invalid(key);
            }
            case ACCESS_MINUTES, REFRESH_DAYS, SESSION_IDLE_HOURS, MAX_ACTIVE_SESSIONS,
                    RECOVERY_MINUTES, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, TOP_LIMIT -> {
                if (value == null || !value.isIntegralNumber() || value.intValue() <= 0) throw invalid(key);
                if (key.equals(TOP_LIMIT) && value.intValue() > 100) throw invalid(key);
                if (key.equals(MAX_ACTIVE_SESSIONS) && value.intValue() > 20) throw invalid(key);
            }
            default -> throw invalid(key);
        }
        if (key.equals(DEFAULT_PAGE_SIZE) && value.intValue() > integerOr(MAX_PAGE_SIZE, 100)) throw invalid(key);
        if (key.equals(MAX_PAGE_SIZE) && value.intValue() < integerOr(DEFAULT_PAGE_SIZE, 20)) throw invalid(key);
    }

    private AppException invalid(String key) {
        return new AppException(HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.CONFIGURATION_INVALID,
                "Invalid value for configuration " + key + ".");
    }

    private AppException notFound(String key) {
        return new AppException(HttpStatus.NOT_FOUND, ErrorCode.RESOURCE_NOT_FOUND,
                "Active configuration not found: " + key + ".");
    }
}
