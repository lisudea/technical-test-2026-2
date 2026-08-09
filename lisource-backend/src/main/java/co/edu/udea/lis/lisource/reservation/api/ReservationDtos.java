package co.edu.udea.lis.lisource.reservation.api;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public final class ReservationDtos {
    private ReservationDtos() {}

    public record CreateReservationRequest(
            @NotEmpty @Size(max = 20) List<@NotNull Long> equipmentIds,
            @NotNull Instant startsAt,
            @NotNull Instant endsAt,
            @Size(max = 2000) String notes) {}

    public record CancelReservationRequest(@Size(max = 1000) String reason) {}
    public record ReservedEquipment(long id, String inventoryCode, String name) {}
    public record BusySlot(Instant startsAt, Instant endsAt) {}

    public record ReservationResponse(
            long id,
            String code,
            Instant startsAt,
            Instant endsAt,
            String notes,
            String status,
            String visualStatus,
            List<ReservedEquipment> equipment,
            Instant createdAt,
            Instant cancelledAt,
            String cancellationReason) {}
}

