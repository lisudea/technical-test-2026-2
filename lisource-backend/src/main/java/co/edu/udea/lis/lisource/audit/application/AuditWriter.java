package co.edu.udea.lis.lisource.audit.application;

import co.edu.udea.lis.lisource.audit.domain.AuditEvent;
import co.edu.udea.lis.lisource.audit.infrastructure.AuditRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditWriter {
    private final AuditRepository repository;

    public AuditWriter(AuditRepository repository) {
        this.repository = repository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void write(AuditEvent event) {
        repository.insert(event);
    }
}

