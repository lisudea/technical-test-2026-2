package co.edu.udea.lis.lisource.configuration.api;

import com.fasterxml.jackson.databind.JsonNode;
import co.edu.udea.lis.lisource.configuration.application.ConfigurationService;
import co.edu.udea.lis.lisource.configuration.domain.ConfigurationValue;
import co.edu.udea.lis.lisource.shared.security.SecurityPrincipal;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/configuration")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class ConfigurationController {
    private final ConfigurationService service;

    public ConfigurationController(ConfigurationService service) {
        this.service = service;
    }

    @GetMapping
    public List<ConfigurationValue> list() {
        return service.list();
    }

    @PatchMapping("/{key}")
    public ConfigurationValue update(@PathVariable String key, @RequestBody UpdateConfigurationRequest request) {
        return service.update(key.toUpperCase(), request.value(), SecurityPrincipal.userId());
    }

    public record UpdateConfigurationRequest(JsonNode value) {}
}
