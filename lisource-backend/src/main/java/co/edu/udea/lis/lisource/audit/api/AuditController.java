package co.edu.udea.lis.lisource.audit.api;

import co.edu.udea.lis.lisource.audit.infrastructure.AuditRepository;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Validated
@RestController
@RequestMapping("/api/v1/admin/audit")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class AuditController {
    private final AuditRepository repository;

    public AuditController(AuditRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<AuditRepository.AuditView> list(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int pageSize,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) String correlationId) {
        return repository.list(pageSize, (page - 1) * pageSize, eventType, correlationId);
    }
}
