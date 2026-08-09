package co.edu.udea.lis.lisource.audit.application;

import co.edu.udea.lis.lisource.audit.domain.AuditEvent;
import co.edu.udea.lis.lisource.shared.util.RequestMetadata;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
public class AuditPublisher {
    private static final Logger log = LoggerFactory.getLogger(AuditPublisher.class);
    private final ApplicationEventPublisher events;
    private final AuditWriter writer;
    private final AuditSanitizer sanitizer;
    private final Clock clock;

    public AuditPublisher(ApplicationEventPublisher events, AuditWriter writer,
                          AuditSanitizer sanitizer, Clock clock) {
        this.events = events;
        this.writer = writer;
        this.sanitizer = sanitizer;
        this.clock = clock;
    }

    public void success(String eventCode, Long actorId, Long recordId, String description,
                        Object oldData, Object newData) {
        events.publishEvent(build(eventCode, actorId, recordId, description, oldData, newData));
    }

    public void rejection(String eventCode, Long actorId, Long recordId, String description,
                          Object details) {
        safeWrite(build(eventCode, actorId, recordId, description, null, details));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void afterCommit(AuditEvent event) {
        safeWrite(event);
    }

    private AuditEvent build(String eventCode, Long actorId, Long recordId, String description,
                             Object oldData, Object newData) {
        RequestMetadata metadata = metadata();
        return new AuditEvent(eventCode, actorId, recordId, description,
                sanitizer.sanitize(oldData), sanitizer.sanitize(newData), metadata.ip(), metadata.userAgent(),
                correlationId(), Instant.now(clock));
    }

    private void safeWrite(AuditEvent event) {
        try {
            writer.write(event);
        } catch (RuntimeException exception) {
            log.error("Audit event {} could not be persisted", event.eventCode(), exception);
        }
    }

    private RequestMetadata metadata() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes) {
            HttpServletRequest request = attributes.getRequest();
            return RequestMetadata.from(request);
        }
        return new RequestMetadata(null, null);
    }

    private UUID correlationId() {
        try {
            return UUID.fromString(MDC.get("correlationId"));
        } catch (RuntimeException ignored) {
            return UUID.randomUUID();
        }
    }
}

