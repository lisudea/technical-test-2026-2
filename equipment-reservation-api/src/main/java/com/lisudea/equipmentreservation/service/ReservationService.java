package com.lisudea.equipmentreservation.service;

import com.lisudea.equipmentreservation.dto.request.CreateReservationRequest;
import com.lisudea.equipmentreservation.dto.response.*;
import com.lisudea.equipmentreservation.entity.*;
import com.lisudea.equipmentreservation.exception.*;
import com.lisudea.equipmentreservation.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReservationService {

    private static final String ACTIVE_STATUS = "ACTIVE";
    private static final String CANCELLED_STATUS = "CANCELLED";
    private static final String MAINTENANCE_STATUS = "MAINTENANCE";
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("America/Bogota");
    private static final LocalTime OPEN_TIME = LocalTime.of(6, 0);
    private static final LocalTime CLOSE_TIME = LocalTime.of(20, 0);

    private final ReservationRepository reservationRepository;
    private final EquipmentRepository equipmentRepository;
    private final ReservationStatusRepository reservationStatusRepository;

    public ReservationService(ReservationRepository reservationRepository,
                              EquipmentRepository equipmentRepository,
                              ReservationStatusRepository reservationStatusRepository) {
        this.reservationRepository = reservationRepository;
        this.equipmentRepository = equipmentRepository;
        this.reservationStatusRepository = reservationStatusRepository;
    }

    @Transactional
    public ReservationResponse create(CreateReservationRequest request) {
        Equipment equipment = equipmentRepository.findById(request.getEquipmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found"));

        if (MAINTENANCE_STATUS.equals(equipment.getOperationalStatus().getName())) {
            throw new EquipmentMaintenanceException("Equipment is under maintenance");
        }

        validateTimeWindow(request.getStartAt(), request.getEndAt());

        ReservationStatus activeStatus = getReservationStatus(ACTIVE_STATUS);
        // First, check for overlap using a DB-level existence check to reduce race window
        boolean existsOverlap = reservationRepository.existsActiveOverlap(
            equipment.getId(), request.getStartAt(), request.getEndAt(), activeStatus.getId());
        if (existsOverlap) {
            throw new ReservationConflictException("Reservation conflicts with an existing active reservation");
        }

        // Fallback local check (existing active future reservations) as defensive measure
        List<Reservation> conflicts = reservationRepository.findByEquipmentAndStatusAndEndAtAfterOrderByStartAtAsc(
            equipment,
            activeStatus,
            OffsetDateTime.now()
        ).stream()
            .filter(existing -> existing.getStartAt().isBefore(request.getEndAt()) && existing.getEndAt().isAfter(request.getStartAt()))
            .toList();

        if (!conflicts.isEmpty()) {
            throw new ReservationConflictException("Reservation conflicts with an existing active reservation");
        }

        Reservation reservation = new Reservation();
        reservation.setEquipment(equipment);
        reservation.setUserName(request.getUserName());
        reservation.setUserEmail(request.getUserEmail());
        reservation.setStartAt(request.getStartAt());
        reservation.setEndAt(request.getEndAt());
        reservation.setStatus(activeStatus);
        Reservation saved = reservationRepository.save(reservation);
        return toResponse(saved);
    }

    @Transactional
    public ReservationResponse cancel(Long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));

        if (CANCELLED_STATUS.equals(reservation.getStatus().getName())) {
            return toResponse(reservation);
        }

        if (reservation.getEndAt().isBefore(OffsetDateTime.now())) {
            throw new InvalidReservationException("Reservation is already finished");
        }

        reservation.setStatus(getReservationStatus(CANCELLED_STATUS));
        reservation.setCancellationReason("Cancelada manualmente");
        return toResponse(reservation);
    }

    @Transactional(readOnly = true)
    public PageResponse<ReservationResponse> listByEquipment(Long equipmentId, int page, int size) {
        Equipment equipment = equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found"));
        Pageable pageable = PageRequest.of(page, size);
        Page<Reservation> reservationPage = reservationRepository.findByEquipmentOrderByStartAtAsc(equipment, pageable);
        List<ReservationResponse> content = reservationPage.getContent().stream().map(this::toResponse).collect(Collectors.toList());
        return new PageResponse<>(content, reservationPage.getNumber(), reservationPage.getSize(), reservationPage.getTotalElements(), reservationPage.getTotalPages());
    }

    @Transactional(readOnly = true)
    public PageResponse<ReservationResponse> list(int page, int size, String status) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Reservation> reservationPage = status == null || status.isBlank()
                ? reservationRepository.findAllByOrderByStartAtAsc(pageable)
                : reservationRepository.findByStatus_NameOrderByStartAtAsc(status, pageable);
        List<ReservationResponse> content = reservationPage.getContent().stream().map(this::toResponse).collect(Collectors.toList());
        return new PageResponse<>(content, reservationPage.getNumber(), reservationPage.getSize(), reservationPage.getTotalElements(), reservationPage.getTotalPages());
    }

    private void validateTimeWindow(OffsetDateTime startAt, OffsetDateTime endAt) {
        OffsetDateTime now = OffsetDateTime.now();
        if (startAt.isBefore(now)) {
            throw new InvalidReservationException("Start time cannot be in the past");
        }

        LocalTime startInBusinessZone = startAt.atZoneSameInstant(BUSINESS_ZONE).toLocalTime();
        LocalTime endInBusinessZone = endAt.atZoneSameInstant(BUSINESS_ZONE).toLocalTime();

        if (startInBusinessZone.isBefore(OPEN_TIME) || startInBusinessZone.isAfter(LocalTime.of(19, 49))) {
            throw new InvalidReservationException("Start time must be between 06:00 and 19:50");
        }
        if (endInBusinessZone.isBefore(OPEN_TIME) || endInBusinessZone.isAfter(CLOSE_TIME)) {
            throw new InvalidReservationException("End time must be between 06:00 and 20:00");
        }
        if (!startAt.isBefore(endAt)) {
            throw new InvalidReservationException("Start time must be before end time");
        }
    }

    private ReservationStatus getReservationStatus(String name) {
        return reservationStatusRepository.findAll().stream()
                .filter(status -> name.equals(status.getName()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Reservation status not found"));
    }

    private ReservationResponse toResponse(Reservation reservation) {
        ReservationResponse response = new ReservationResponse();
        response.setId(reservation.getId());
        EquipmentReservationSummary equipmentSummary = new EquipmentReservationSummary();
        equipmentSummary.setId(reservation.getEquipment().getId());
        equipmentSummary.setName(reservation.getEquipment().getName());
        equipmentSummary.setCategory(toCategoryResponse(reservation.getEquipment().getCategory()));
        response.setEquipment(equipmentSummary);
        response.setUserName(reservation.getUserName());
        response.setUserEmail(reservation.getUserEmail());
        response.setStartAt(reservation.getStartAt());
        response.setEndAt(reservation.getEndAt());
        response.setStatus(toReservationStatusResponse(reservation.getStatus()));
        response.setCancellationReason(reservation.getCancellationReason());
        response.setCreatedAt(reservation.getCreatedAt());
        return response;
    }

    private CategoryResponse toCategoryResponse(Category category) {
        return new CategoryResponse(category.getId(), category.getName());
    }

    private ReservationStatusResponse toReservationStatusResponse(ReservationStatus status) {
        return new ReservationStatusResponse(status.getId(), status.getName());
    }
}
