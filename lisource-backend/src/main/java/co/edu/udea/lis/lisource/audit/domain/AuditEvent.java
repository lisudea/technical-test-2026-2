package co.edu.udea.lis.lisource.audit.domain;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.UUID;

public record AuditEvent(
        String eventCode,
        Long actorId,
        Long affectedRecordId,
        String description,
        JsonNode oldData,
        JsonNode newData,
        String sourceIp,
        String userAgent,
        UUID correlationId,
        Instant occurredAt) {}

