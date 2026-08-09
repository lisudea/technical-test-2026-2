package co.edu.udea.lis.lisource.equipment.application;

import co.edu.udea.lis.lisource.audit.application.AuditPublisher;
import co.edu.udea.lis.lisource.catalog.infrastructure.CatalogRepository;
import co.edu.udea.lis.lisource.configuration.application.ConfigurationService;
import co.edu.udea.lis.lisource.equipment.api.EquipmentDtos.*;
import co.edu.udea.lis.lisource.equipment.infrastructure.EquipmentRepository;
import co.edu.udea.lis.lisource.equipment.infrastructure.EquipmentRepository.NormalizedEquipment;
import co.edu.udea.lis.lisource.shared.exception.*;
import co.edu.udea.lis.lisource.shared.web.PagedResponse;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import co.edu.udea.lis.lisource.shared.web.RealtimeEventPublisher;

@Service
public class EquipmentService {
    private static final Set<String> STATUSES = Set.of("OPERATIVO", "MANTENIMIENTO", "FUERA_SERVICIO", "RETIRADO");
    private static final Set<String> VISUAL_STATUSES = Set.of("AVAILABLE", "RESERVED", "MAINTENANCE", "OUT_OF_SERVICE", "RETIRED");
    private final EquipmentRepository repository;
    private final CatalogRepository catalogs;
    private final ConfigurationService configuration;
    private final AuditPublisher audit;
    private final EquipmentImageStorage images;
    private final RealtimeEventPublisher realtime;

    public EquipmentService(EquipmentRepository repository, CatalogRepository catalogs,
                            ConfigurationService configuration, AuditPublisher audit,
                            EquipmentImageStorage images, RealtimeEventPublisher realtime) {
        this.repository = repository;
        this.catalogs = catalogs;
        this.configuration = configuration;
        this.audit = audit;
        this.images = images;
        this.realtime = realtime;
    }

    public PagedResponse<EquipmentResponse> list(Integer pageValue, Integer sizeValue, String search,
                                                  String category, String status, String operationalStatus, String sort) {
        int page = pageValue == null ? 1 : pageValue;
        int max = configuration.integerOr(ConfigurationService.MAX_PAGE_SIZE, 100);
        int size = sizeValue == null ? configuration.integerOr(ConfigurationService.DEFAULT_PAGE_SIZE, 20) : sizeValue;
        if (page < 1 || size < 1 || size > max) throw validation("Pagination values are outside the allowed range.");
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")
                && !VISUAL_STATUSES.contains(status.toUpperCase(Locale.ROOT))) throw validation("Unknown visual status.");
        if (operationalStatus != null && !operationalStatus.isBlank()
                && !STATUSES.contains(operationalStatus.toUpperCase(Locale.ROOT))) throw validation("Unknown operational status.");
        EquipmentRepository.EquipmentPage result = repository.list(page, size, search, category, status, operationalStatus, sort);
        return PagedResponse.of(result.items(), page, size, result.total());
    }

    public EquipmentResponse get(long id) {
        return repository.findById(id).orElseThrow(this::notFound);
    }

    @Transactional
    public EquipmentResponse create(EquipmentInput input, long actorId) {
        NormalizedEquipment normalized = normalize(input, null);
        int category = catalogs.activeCategoryId(input.categoryId()).orElseThrow(() -> validation("Unknown category."));
        Integer location = location(input.locationId());
        String status = requireStatus(input.operationalStatus());
        int state = catalogs.equipmentStateId(status).orElseThrow(() -> validation("Unknown operational status."));
        ensureUnique(normalized, null);
        long id = repository.insert(normalized, category, location, state);
        EquipmentResponse result = get(id);
        audit.success("CREAR_EQUIPO", actorId, id, "Equipment created", null, result);
        realtime.equipment("EQUIPMENT_CREATED", id, result.visualStatus());
        return result;
    }

    @Transactional
    public EquipmentResponse update(long id, EquipmentInput input, long actorId) {
        EquipmentResponse before = get(id);
        NormalizedEquipment normalized = normalize(input, before.imageUrl());
        int category = catalogs.activeCategoryId(input.categoryId()).orElseThrow(() -> validation("Unknown category."));
        Integer location = location(input.locationId());
        String status = requireStatus(input.operationalStatus());
        int state = catalogs.equipmentStateId(status).orElseThrow(() -> validation("Unknown operational status."));
        if (!status.equals("OPERATIVO") && before.operationalStatus().code().equals("OPERATIVO")
                && repository.hasConfirmedCurrentOrFutureReservation(id)) {
            throw new AppException(HttpStatus.CONFLICT, ErrorCode.EQUIPMENT_NOT_RESERVABLE,
                    "Equipment with current or future reservations cannot leave operational status.");
        }
        ensureUnique(normalized, id);
        if (repository.update(id, normalized, category, location, state) != 1) throw notFound();
        EquipmentResponse after = get(id);
        audit.success("ACTUALIZAR_EQUIPO", actorId, id, "Equipment updated", before, after);
        realtime.equipment("EQUIPMENT_UPDATED", id, after.visualStatus());
        return after;
    }

    @Transactional
    public EquipmentResponse changeStatus(long id, String requestedStatus, long actorId) {
        EquipmentResponse before = get(id);
        String status = requireStatus(requestedStatus);
        if (!status.equals("OPERATIVO") && repository.hasConfirmedCurrentOrFutureReservation(id)) {
            throw new AppException(HttpStatus.CONFLICT, ErrorCode.EQUIPMENT_NOT_RESERVABLE,
                    "Equipment with current or future reservations cannot leave operational status.");
        }
        int state = catalogs.equipmentStateId(status).orElseThrow(() -> validation("Unknown operational status."));
        if (repository.changeStatus(id, state) != 1) throw notFound();
        EquipmentResponse after = get(id);
        audit.success("CAMBIAR_ESTADO_EQUIPO", actorId, id, "Equipment status changed", before, after);
        realtime.equipment("EQUIPMENT_STATUS_CHANGED", id, after.visualStatus());
        return after;
    }

    @Transactional
    public EquipmentResponse replaceImage(long id, MultipartFile file, long actorId) {
        EquipmentResponse before = get(id);
        StoredEquipmentImage stored = images.store(id, file);
        try {
            if (repository.updateImageUrl(id, stored.publicUrl()) != 1) throw notFound();
            if (before.imageUrl() != null && !before.imageUrl().equals(stored.publicUrl())) {
                afterCommit(() -> images.deleteByPublicUrl(before.imageUrl()));
            }
            EquipmentResponse after = get(id);
            audit.success("ACTUALIZAR_IMAGEN_EQUIPO", actorId, id,
                    "Equipment image replaced", Map.of("hadImage", before.imageUrl() != null),
                    Map.of("hasImage", true));
            realtime.equipment("EQUIPMENT_UPDATED", id, after.visualStatus());
            return after;
        } catch (RuntimeException exception) {
            images.delete(stored.path());
            throw exception;
        }
    }

    @Transactional
    public EquipmentResponse deleteImage(long id, long actorId) {
        EquipmentResponse before = get(id);
        if (before.imageUrl() == null) return before;
        if (repository.updateImageUrl(id, null) != 1) throw notFound();
        afterCommit(() -> images.deleteByPublicUrl(before.imageUrl()));
        EquipmentResponse after = get(id);
        audit.success("ELIMINAR_IMAGEN_EQUIPO", actorId, id, "Equipment image removed",
                Map.of("hadImage", true), Map.of("hasImage", false));
        realtime.equipment("EQUIPMENT_UPDATED", id, after.visualStatus());
        return after;
    }

    private NormalizedEquipment normalize(EquipmentInput input, String existingImageUrl) {
        String inventory = input.inventoryCode().trim().toUpperCase(Locale.ROOT);
        String name = input.name().trim();
        String serial = blankToNull(input.serialNumber());
        String mac = blankToNull(input.macAddress());
        if (mac != null) mac = mac.toLowerCase(Locale.ROOT);
        if (!inventory.matches("^[A-Z0-9._/-]+$") || name.isBlank()) throw validation("Equipment code or name is invalid.");
        if (serial == null && mac == null) throw validation("A serial number or MAC address is required.");
        if (mac != null && !mac.matches("^([0-9a-f]{2}:){5}[0-9a-f]{2}$")) throw validation("MAC address is invalid.");
        return new NormalizedEquipment(inventory, name, blankToNull(input.description()), serial, mac, existingImageUrl);
    }

    private void ensureUnique(NormalizedEquipment input, Long excludedId) {
        if (repository.identifierConflict(input.inventoryCode(), input.serialNumber(), input.macAddress(), excludedId)) {
            throw new AppException(HttpStatus.CONFLICT, ErrorCode.EQUIPMENT_IDENTIFIER_CONFLICT,
                    "Inventory code, serial number or MAC address already exists.");
        }
    }

    private Integer location(Integer id) {
        if (id == null) return null;
        return catalogs.activeLocationId(id).orElseThrow(() -> validation("Unknown location."));
    }

    private String requireStatus(String value) {
        String status = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        if (!STATUSES.contains(status)) throw validation("Unknown operational status.");
        return status;
    }

    private String blankToNull(String value) { return value == null || value.trim().isBlank() ? null : value.trim(); }
    private AppException validation(String detail) { return new AppException(HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.VALIDATION_ERROR, detail); }
    private AppException notFound() { return new AppException(HttpStatus.NOT_FOUND, ErrorCode.EQUIPMENT_NOT_FOUND, "Equipment was not found."); }

    private void afterCommit(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            action.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() { action.run(); }
        });
    }
}
