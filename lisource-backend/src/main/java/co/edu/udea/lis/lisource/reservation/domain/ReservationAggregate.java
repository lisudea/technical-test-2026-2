package co.edu.udea.lis.lisource.reservation.domain;

import java.time.Instant;
import java.util.List;

public record ReservationAggregate(long id, String code, long ownerId, String persistedStatus,
                                   Instant startsAt, Instant endsAt, String notes, Instant createdAt,
                                   Instant cancelledAt, String cancellationReason,
                                   List<ReservedEquipment> equipment) {}
