package com.lisudea.equipmentreservation.service;

import com.lisudea.equipmentreservation.dto.request.CreateEquipmentRequest;
import com.lisudea.equipmentreservation.dto.request.UpdateEquipmentRequest;
import com.lisudea.equipmentreservation.dto.response.*;
import com.lisudea.equipmentreservation.entity.*;
import com.lisudea.equipmentreservation.exception.*;
import com.lisudea.equipmentreservation.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
public class EquipmentService {

    private static final String MAINTENANCE_STATUS = "MAINTENANCE";
    private static final String OPERATIONAL_STATUS = "OPERATIONAL";
    private static final String ACTIVE_STATUS = "ACTIVE";
    private static final String CANCELLED_STATUS = "CANCELLED";

    private final EquipmentRepository equipmentRepository;
    private final CategoryRepository categoryRepository;
    private final OperationalStatusRepository operationalStatusRepository;
    private final ReservationRepository reservationRepository;
    private final ReservationStatusRepository reservationStatusRepository;

    public EquipmentService(EquipmentRepository equipmentRepository,
                            CategoryRepository categoryRepository,
                            OperationalStatusRepository operationalStatusRepository,
                            ReservationRepository reservationRepository,
                            ReservationStatusRepository reservationStatusRepository) {
        this.equipmentRepository = equipmentRepository;
        this.categoryRepository = categoryRepository;
        this.operationalStatusRepository = operationalStatusRepository;
        this.reservationRepository = reservationRepository;
        this.reservationStatusRepository = reservationStatusRepository;
    }

    @Transactional
    public EquipmentResponse create(CreateEquipmentRequest request) {
        validateUniqueIdentifiers(request.getSerialNumber(), request.getMacAddress());
        Category category = getCategory(request.getCategoryId());
        OperationalStatus status = getOperationalStatus(request.getOperationalStatusId());

        Equipment equipment = new Equipment();
        equipment.setName(request.getName());
        equipment.setSerialNumber(request.getSerialNumber());
        equipment.setMacAddress(request.getMacAddress());
        equipment.setCategory(category);
        equipment.setOperationalStatus(status);
        Equipment saved = equipmentRepository.save(equipment);
        return toResponse(saved);
    }

    @Transactional
    public EquipmentResponse update(Long id, UpdateEquipmentRequest request) {
        Equipment equipment = equipmentRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Equipment not found"));
        validateUniqueIdentifiersForUpdate(id, request.getSerialNumber(), request.getMacAddress());
        Category category = getCategory(request.getCategoryId());
        OperationalStatus status = getOperationalStatus(request.getOperationalStatusId());

        equipment.setName(request.getName());
        equipment.setSerialNumber(request.getSerialNumber());
        equipment.setMacAddress(request.getMacAddress());
        equipment.setCategory(category);
        equipment.setOperationalStatus(status);
        if (MAINTENANCE_STATUS.equals(status.getName())) {
            cancelActiveReservationsForMaintenance(equipment);
        }
        return toResponse(equipment);
    }

    @Transactional(readOnly = true)
    public PageResponse<EquipmentSummaryResponse> list(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Equipment> equipmentPage = equipmentRepository.findAll(pageable);
        List<EquipmentSummaryResponse> content = new ArrayList<>();
        for (Equipment equipment : equipmentPage.getContent()) {
            content.add(toSummaryResponse(equipment));
        }
        return new PageResponse<>(content, equipmentPage.getNumber(), equipmentPage.getSize(), equipmentPage.getTotalElements(), equipmentPage.getTotalPages());
    }

    @Transactional(readOnly = true)
    public PageResponse<EquipmentSummaryResponse> list(int page, int size, Long categoryId, Long operationalStatusId) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Equipment> equipmentPage = equipmentRepository.findByOptionalFilters(categoryId, operationalStatusId, pageable);
        List<EquipmentSummaryResponse> content = new ArrayList<>();
        for (Equipment equipment : equipmentPage.getContent()) {
            content.add(toSummaryResponse(equipment));
        }
        return new PageResponse<>(content, equipmentPage.getNumber(), equipmentPage.getSize(), equipmentPage.getTotalElements(), equipmentPage.getTotalPages());
    }

    @Transactional(readOnly = true)
    public EquipmentResponse getById(Long id) {
        Equipment equipment = equipmentRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Equipment not found"));
        return toResponse(equipment);
    }

    @Transactional(readOnly = true)
    public AvailabilityResponse getAvailability(Long id, OffsetDateTime startAt, OffsetDateTime endAt) {
        Equipment equipment = equipmentRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Equipment not found"));
        if (MAINTENANCE_STATUS.equals(equipment.getOperationalStatus().getName())) {
            AvailabilityResponse response = new AvailabilityResponse();
            response.setEquipmentId(id);
            response.setAvailability("MAINTENANCE");
            return response;
        }

        List<Reservation> activeReservations = reservationRepository.findByEquipmentAndStatusAndEndAtAfterOrderByStartAtAsc(
                equipment,
                getReservationStatus(ACTIVE_STATUS),
                OffsetDateTime.now()
        );

        for (Reservation reservation : activeReservations) {
            if (reservation.getStartAt().isBefore(endAt) && reservation.getEndAt().isAfter(startAt)) {
                AvailabilityResponse response = new AvailabilityResponse();
                response.setEquipmentId(id);
                response.setAvailability("RESERVED");
                response.setNextAvailableStartAt(reservation.getEndAt());
                int currentIndex = activeReservations.indexOf(reservation);
                if (currentIndex + 1 < activeReservations.size()) {
                    response.setNextReservedStartAt(activeReservations.get(currentIndex + 1).getStartAt());
                }
                return response;
            }
        }

        AvailabilityResponse response = new AvailabilityResponse();
        response.setEquipmentId(id);
        response.setAvailability("AVAILABLE");
        return response;
    }

    public List<TopEquipmentResponse> getTopReserved() {
        return reservationRepository.findTopReservedEquipment(PageRequest.of(0, 5));
    }

    @Transactional
    public void cancelActiveReservationsForMaintenance(Equipment equipment) {
        List<Reservation> reservations = reservationRepository.findByEquipmentAndStatusAndEndAtAfterOrderByStartAtAsc(
                equipment,
                getReservationStatus(ACTIVE_STATUS),
                OffsetDateTime.now()
        );
        ReservationStatus cancelledStatus = getReservationStatus(CANCELLED_STATUS);
        for (Reservation reservation : reservations) {
            reservation.setStatus(cancelledStatus);
            reservation.setCancellationReason("Equipo puesto en mantenimiento");
        }
    }

    private void validateUniqueIdentifiers(String serialNumber, String macAddress) {
        if (serialNumber != null && !serialNumber.isBlank() && equipmentRepository.findBySerialNumber(serialNumber).isPresent()) {
            throw new DuplicateResourceException("Serial number already exists");
        }
        if (macAddress != null && !macAddress.isBlank() && equipmentRepository.findByMacAddress(macAddress).isPresent()) {
            throw new DuplicateResourceException("MAC address already exists");
        }
    }

    private void validateUniqueIdentifiersForUpdate(Long equipmentId, String serialNumber, String macAddress) {
        if (serialNumber != null && !serialNumber.isBlank()) {
            equipmentRepository.findBySerialNumber(serialNumber).ifPresent(existing -> {
                if (!Objects.equals(existing.getId(), equipmentId)) {
                    throw new DuplicateResourceException("Serial number already exists");
                }
            });
        }
        if (macAddress != null && !macAddress.isBlank()) {
            equipmentRepository.findByMacAddress(macAddress).ifPresent(existing -> {
                if (!Objects.equals(existing.getId(), equipmentId)) {
                    throw new DuplicateResourceException("MAC address already exists");
                }
            });
        }
    }

    private Category getCategory(Long id) {
        return categoryRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Category not found"));
    }

    private OperationalStatus getOperationalStatus(Long id) {
        return operationalStatusRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Operational status not found"));
    }

    private ReservationStatus getReservationStatus(String name) {
        return reservationStatusRepository.findAll().stream()
                .filter(status -> name.equals(status.getName()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Reservation status not found"));
    }

    private EquipmentResponse toResponse(Equipment equipment) {
        EquipmentResponse response = new EquipmentResponse();
        response.setId(equipment.getId());
        response.setName(equipment.getName());
        response.setSerialNumber(equipment.getSerialNumber());
        response.setMacAddress(equipment.getMacAddress());
        response.setCategory(toCategoryResponse(equipment.getCategory()));
        response.setOperationalStatus(toOperationalStatusResponse(equipment.getOperationalStatus()));
        response.setCreatedAt(equipment.getCreatedAt());
        response.setUpdatedAt(equipment.getUpdatedAt());
        return response;
    }

    private EquipmentSummaryResponse toSummaryResponse(Equipment equipment) {
        EquipmentSummaryResponse response = new EquipmentSummaryResponse();
        response.setId(equipment.getId());
        response.setName(equipment.getName());
        response.setSerialNumber(equipment.getSerialNumber());
        response.setMacAddress(equipment.getMacAddress());
        response.setCategory(toCategoryResponse(equipment.getCategory()));
        response.setOperationalStatus(toOperationalStatusResponse(equipment.getOperationalStatus()));
        response.setCreatedAt(equipment.getCreatedAt());
        response.setUpdatedAt(equipment.getUpdatedAt());
        return response;
    }

    private CategoryResponse toCategoryResponse(Category category) {
        return new CategoryResponse(category.getId(), category.getName());
    }

    private OperationalStatusResponse toOperationalStatusResponse(OperationalStatus operationalStatus) {
        return new OperationalStatusResponse(operationalStatus.getId(), operationalStatus.getName());
    }
}
