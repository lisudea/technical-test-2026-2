package com.example.lis_equipment_system.reservation.service.impl;

import com.example.lis_equipment_system.common.exception.ReservationConflictException;
import com.example.lis_equipment_system.common.exception.ResourceNotFoundException;
import com.example.lis_equipment_system.equipment.entity.Equipment;
import com.example.lis_equipment_system.equipment.repository.EquipmentRepository;
import com.example.lis_equipment_system.reservation.dto.ReservationRequest;
import com.example.lis_equipment_system.reservation.dto.ReservationResponse;
import com.example.lis_equipment_system.reservation.entity.Reservation;
import com.example.lis_equipment_system.reservation.entity.enumerator.ReservationStatus;
import com.example.lis_equipment_system.reservation.repository.ReservationRepository;
import com.example.lis_equipment_system.reservation.service.ReservationService;
import com.example.lis_equipment_system.user.entity.User;
import com.example.lis_equipment_system.user.entity.enumerator.Role;
import com.example.lis_equipment_system.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository reservationRepository;
    private final EquipmentRepository equipmentRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ReservationResponse create(ReservationRequest request, String userEmail) {
        if (!request.dateEndTime().isAfter(request.dateStartTime())) {
            throw new IllegalArgumentException("La fecha de fin debe ser posterior a la fecha de inicio");
        }

        Equipment equipment = equipmentRepository.findById(request.equipmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipo no encontrado con id: " + request.equipmentId()));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + userEmail));

        boolean overlap = reservationRepository.overlaps(
        equipment.getId(), ReservationStatus.ACTIVE, request.dateStartTime(), request.dateEndTime());

        if (overlap) {
            throw new ReservationConflictException("El equipo ya está reservado en ese horario");
        }

        Reservation reservation = new Reservation();
        reservation.setEquipment(equipment);
        reservation.setUser(user);
        reservation.setDateStartTime(request.dateStartTime());
        reservation.setDateEndTime(request.dateEndTime());
        reservation.setStatus(ReservationStatus.ACTIVE);
        reservation.setCreationDate(LocalDateTime.now());

        return toResponse(reservationRepository.save(reservation));
    }

    @Override
    @Transactional
    public void cancel(Long id, String userEmail) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada con id: " + id));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + userEmail));

        boolean isOwner = reservation.getUser().getEmail().equalsIgnoreCase(userEmail);
        boolean isAdmin = user.getRole() == Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("No tienes permiso para cancelar esta reserva");
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservationRepository.save(reservation);
    }

    @Override
    public Page<ReservationResponse> findAll(Long equipmentId, Pageable pageable) {
        Page<Reservation> page = (equipmentId != null)
                ? reservationRepository.findByEquipmentId(equipmentId, pageable)
                : reservationRepository.findAll(pageable);

        return page.map(this::toResponse);
    }

    private ReservationResponse toResponse(Reservation reservation) {
        return new ReservationResponse(
                reservation.getId(),
                reservation.getEquipment().getId(),
                reservation.getEquipment().getName(),
                reservation.getUser().getName(),
                reservation.getUser().getEmail(),
                reservation.getDateStartTime(),
                reservation.getDateEndTime(),
                reservation.getStatus(),
                reservation.getCreationDate()
        );
    }
}