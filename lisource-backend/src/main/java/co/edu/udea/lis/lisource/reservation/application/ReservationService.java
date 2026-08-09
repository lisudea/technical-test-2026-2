package co.edu.udea.lis.lisource.reservation.application;

import co.edu.udea.lis.lisource.audit.application.AuditPublisher;
import co.edu.udea.lis.lisource.catalog.infrastructure.CatalogRepository;
import co.edu.udea.lis.lisource.equipment.infrastructure.EquipmentRepository;
import co.edu.udea.lis.lisource.equipment.infrastructure.EquipmentRepository.EquipmentLock;
import co.edu.udea.lis.lisource.reservation.api.ReservationDtos.*;
import co.edu.udea.lis.lisource.reservation.domain.ReservationAggregate;
import co.edu.udea.lis.lisource.reservation.infrastructure.ReservationRepository;
import co.edu.udea.lis.lisource.shared.exception.*;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import co.edu.udea.lis.lisource.shared.web.RealtimeEventPublisher;

@Service
public class ReservationService {
    private final ReservationRepository reservations;
    private final EquipmentRepository equipment;
    private final CatalogRepository catalogs;
    private final AuditPublisher audit;
    private final Clock clock;
    private final RealtimeEventPublisher realtime;

    public ReservationService(ReservationRepository reservations, EquipmentRepository equipment,
                              CatalogRepository catalogs, AuditPublisher audit, Clock clock,
                              RealtimeEventPublisher realtime) {
        this.reservations = reservations;
        this.equipment = equipment;
        this.catalogs = catalogs;
        this.audit = audit;
        this.clock = clock;
        this.realtime = realtime;
    }

    @Transactional
    public ReservationResponse create(CreateReservationRequest request, long userId) {
        validateRange(request.startsAt(), request.endsAt());
        if (request.equipmentIds() == null || request.equipmentIds().isEmpty()) throw validation("At least one equipment is required.");
        Set<Long> unique = new HashSet<>(request.equipmentIds());
        if (unique.size() != request.equipmentIds().size()) throw validation("Duplicate equipment IDs are not allowed.");
        List<Long> ids = unique.stream().sorted().toList();

        List<EquipmentLock> locked = equipment.lockInOrder(ids);
        if (locked.size() != ids.size()) {
            throw new AppException(HttpStatus.NOT_FOUND, ErrorCode.EQUIPMENT_NOT_FOUND,
                    "One or more requested equipment items do not exist.");
        }
        List<Long> unavailable = locked.stream().filter(item -> !"OPERATIVO".equals(item.operationalStatus()))
                .map(EquipmentLock::id).toList();
        if (!unavailable.isEmpty()) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.EQUIPMENT_NOT_RESERVABLE,
                    "One or more requested equipment items are not operational.");
        }
        if (reservations.overlapExists(ids, request.startsAt(), request.endsAt())) {
            audit.rejection("RESERVA_CONFLICTO", userId, null, "Reservation overlap rejected",
                    Map.of("equipmentIds", ids, "startsAt", request.startsAt(), "endsAt", request.endsAt()));
            throw new AppException(HttpStatus.CONFLICT, ErrorCode.RESERVATION_CONFLICT,
                    "One or more requested equipment items are unavailable for the selected time range.");
        }

        int confirmed = catalogs.reservationStateId("CONFIRMADA")
                .orElseThrow(() -> new IllegalStateException("CONFIRMADA reservation state is missing"));
        String code = uniqueCode();
        long id = reservations.insert(code, userId, confirmed, request.startsAt(), request.endsAt(), blankToNull(request.notes()));
        reservations.insertEquipment(id, ids);
        ReservationResponse response = toResponse(required(id));
        audit.success("CREAR_RESERVA", userId, id, "Reservation created", null,
                Map.of("code", code, "equipmentIds", ids, "startsAt", request.startsAt(), "endsAt", request.endsAt()));
        realtime.reservation("RESERVATION_CREATED", id);
        return response;
    }

    public List<ReservationResponse> listMine(long userId) {
        return reservations.findByOwner(userId).stream().map(this::toResponse).toList();
    }

    public ReservationResponse get(long id, long userId, boolean admin) {
        ReservationAggregate reservation = required(id);
        if (!admin && reservation.ownerId() != userId) throw forbidden();
        return toResponse(reservation);
    }

    @Transactional
    public ReservationResponse cancel(long id, long userId, boolean admin, String reason) {
        ReservationAggregate before = required(id);
        if (!admin && before.ownerId() != userId) throw forbidden();
        if ("CANCELADA".equals(before.persistedStatus())) {
            throw new AppException(HttpStatus.CONFLICT, ErrorCode.RESERVATION_ALREADY_CANCELLED,
                    "The reservation is already cancelled.");
        }
        if (!before.startsAt().isAfter(Instant.now(clock))) {
            throw new AppException(HttpStatus.CONFLICT, ErrorCode.RESERVATION_CANNOT_BE_CANCELLED,
                    "Only upcoming reservations can be cancelled.");
        }
        int cancelled = catalogs.reservationStateId("CANCELADA")
                .orElseThrow(() -> new IllegalStateException("CANCELADA reservation state is missing"));
        reservations.cancel(id, cancelled, userId, blankToNull(reason));
        ReservationAggregate after = required(id);
        audit.success("CANCELAR_RESERVA", userId, id, "Reservation cancelled",
                Map.of("status", before.persistedStatus()), Map.of("status", after.persistedStatus(),
                        "reason", after.cancellationReason() == null ? "" : after.cancellationReason()));
        realtime.reservation("RESERVATION_CANCELLED", id);
        return toResponse(after);
    }

    public List<BusySlot> busySlots(long equipmentId) {
        if (equipment.findById(equipmentId).isEmpty()) throw new AppException(HttpStatus.NOT_FOUND,
                ErrorCode.EQUIPMENT_NOT_FOUND, "Equipment was not found.");
        return reservations.busySlots(equipmentId, Instant.now(clock));
    }

    public boolean available(long equipmentId, Instant startsAt, Instant endsAt) {
        validateRange(startsAt, endsAt);
        return !reservations.overlapExists(List.of(equipmentId), startsAt, endsAt);
    }

    void validateRange(Instant startsAt, Instant endsAt) {
        if (startsAt == null || endsAt == null || !endsAt.isAfter(startsAt)) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.INVALID_DATE_RANGE,
                    "Reservation end must be after its start.");
        }
    }

    private ReservationAggregate required(long id) {
        return reservations.findById(id).orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                ErrorCode.RESERVATION_NOT_FOUND, "Reservation was not found."));
    }

    private ReservationResponse toResponse(ReservationAggregate value) {
        Instant now = Instant.now(clock);
        String status = "CANCELADA".equals(value.persistedStatus()) ? "CANCELLED" : "CONFIRMED";
        String visual = status.equals("CANCELLED") ? "CANCELLED"
                : now.isBefore(value.startsAt()) ? "UPCOMING"
                : !now.isBefore(value.endsAt()) ? "FINISHED" : "IN_PROGRESS";
        return new ReservationResponse(value.id(), value.code(), value.startsAt(), value.endsAt(),
                value.notes(), status, visual, value.equipment().stream()
                        .map(item -> new ReservedEquipment(item.id(), item.inventoryCode(), item.name())).toList(),
                value.createdAt(), value.cancelledAt(),
                value.cancellationReason());
    }

    private String uniqueCode() {
        for (int attempt = 0; attempt < 5; attempt++) {
            String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT);
            String code = "LIS-RES-" + DateTimeFormatter.BASIC_ISO_DATE.withZone(ZoneOffset.UTC)
                    .format(Instant.now(clock)) + "-" + suffix;
            if (!reservations.codeExists(code)) return code;
        }
        throw new IllegalStateException("Could not generate a unique reservation code");
    }

    private String blankToNull(String value) { return value == null || value.trim().isBlank() ? null : value.trim(); }
    private AppException validation(String detail) { return new AppException(HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.VALIDATION_ERROR, detail); }
    private AppException forbidden() { return new AppException(HttpStatus.FORBIDDEN, ErrorCode.ACCESS_DENIED, "You cannot access this reservation."); }
}
