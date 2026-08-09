package co.edu.udea.lis.lisource.shared.web;

import java.time.Clock;
import java.time.Instant;
import org.slf4j.MDC;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Service
public class RealtimeEventPublisher {
    private final ApplicationEventPublisher events;
    private final SimpMessagingTemplate messaging;
    private final Clock clock;

    public RealtimeEventPublisher(ApplicationEventPublisher events, SimpMessagingTemplate messaging, Clock clock) {
        this.events = events;
        this.messaging = messaging;
        this.clock = clock;
    }

    public void equipment(String type, long equipmentId, String visualStatus) {
        events.publishEvent(new RealtimeEvent(type, equipmentId, null, visualStatus,
                Instant.now(clock), MDC.get("correlationId")));
    }

    public void reservation(String type, long reservationId) {
        events.publishEvent(new RealtimeEvent(type, null, reservationId, null,
                Instant.now(clock), MDC.get("correlationId")));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void afterCommit(RealtimeEvent event) {
        if (event.equipmentId() != null) messaging.convertAndSend("/topic/equipment-status", event);
        if (event.reservationId() != null) messaging.convertAndSend("/topic/reservations", event);
        messaging.convertAndSend("/topic/dashboard", event);
    }

    public record RealtimeEvent(String type, Long equipmentId, Long reservationId, String visualStatus,
                                Instant occurredAt, String correlationId) {}
}
