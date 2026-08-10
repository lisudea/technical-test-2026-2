package com.udea.labreservas.service;

import com.udea.labreservas.dto.CreateReservationDTO;
import com.udea.labreservas.dto.ReservationDTO;
import com.udea.labreservas.entity.EquipmentStatus;
import com.udea.labreservas.entity.LabEquipment;
import com.udea.labreservas.entity.Reservation;
import com.udea.labreservas.entity.ReservationStatus;
import com.udea.labreservas.entity.Role;
import com.udea.labreservas.entity.User;
import com.udea.labreservas.exception.EquipmentNotAvailableException;
import com.udea.labreservas.exception.ForbiddenOperationException;
import com.udea.labreservas.exception.InvalidRequestException;
import com.udea.labreservas.exception.ReservationConflictException;
import com.udea.labreservas.exception.ResourceNotFoundException;
import com.udea.labreservas.mapping.ReservationMapper;
import com.udea.labreservas.repository.LabEquipmentRepository;
import com.udea.labreservas.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final LabEquipmentRepository equipmentRepository;
    private final EquipmentService equipmentService;
    private final UserService userService;
    private final ReservationMapper reservationMapper;

    @Transactional
    public ReservationDTO create(String email, CreateReservationDTO dto) {
        if (!dto.isValidPeriod()) {
            throw new InvalidRequestException(
                    "La fecha y hora de inicio debe ser anterior a la fecha y hora de finalizacion");
        }

        User user = userService.requireByEmail(email);
        LabEquipment equipment = equipmentService.requireById(dto.equipmentId());

        if (equipment.getStatus() == EquipmentStatus.EN_MANTENIMIENTO) {
            throw new EquipmentNotAvailableException(
                    "El equipo seleccionado esta en mantenimiento y no puede ser reservado");
        }

        long overlapping = reservationRepository.countOverlapping(
                equipment.getEquipmentId(), dto.startTime(), dto.endTime(),
                ReservationStatus.CREADA, null);

        if (overlapping > 0) {
            throw new ReservationConflictException(
                    "El equipo ya tiene una reserva activa que se traslapa con el horario seleccionado. " +
                            "Debe elegir un horario distinto");
        }

        Reservation reservation = new Reservation();
        reservation.setUser(user);
        reservation.setEquipment(equipment);
        reservation.setStartTime(dto.startTime());
        reservation.setEndTime(dto.endTime());
        reservation.setStatus(ReservationStatus.CREADA);

        Reservation saved = reservationRepository.save(reservation);

        if (equipment.getStatus() == EquipmentStatus.DISPONIBLE) {
            equipment.setStatus(EquipmentStatus.RESERVADO);
            equipmentRepository.save(equipment);
        }

        return reservationMapper.toDto(saved);
    }

    @Transactional
    public void cancel(String email, Integer reservationId) {
        Reservation reservation = requireById(reservationId);
        User currentUser = userService.requireByEmail(email);

        boolean isOwner = reservation.getUser().getUserId().equals(currentUser.getUserId());
        boolean isAdmin = currentUser.getRole() == Role.ADMINISTRADOR;

        if (!isOwner && !isAdmin) {
            throw new ForbiddenOperationException(
                    "No esta autorizado para cancelar una reserva que no le pertenece");
        }

        if (reservation.getStatus() == ReservationStatus.FINALIZADA) {
            throw new InvalidRequestException("No se puede cancelar una reserva que ya fue finalizada");
        }
        if (reservation.getStatus() == ReservationStatus.CANCELADA) {
            throw new InvalidRequestException("La reserva ya se encuentra cancelada");
        }

        reservation.setStatus(ReservationStatus.CANCELADA);
        reservationRepository.save(reservation);

        refreshEquipmentAvailability(reservation.getEquipment().getEquipmentId());
    }

    @Transactional
    public void markFinishedReservations() {
        List<Reservation> expiredActive = reservationRepository
                .findByStatusAndEndTimeLessThanEqual(ReservationStatus.CREADA, LocalDateTime.now());

        if (expiredActive.isEmpty()) {
            return;
        }

        expiredActive.forEach(reservation -> reservation.setStatus(ReservationStatus.FINALIZADA));
        reservationRepository.saveAll(expiredActive);

        expiredActive.stream()
                .map(reservation -> reservation.getEquipment().getEquipmentId())
                .distinct()
                .forEach(this::refreshEquipmentAvailability);
    }

    @Transactional(readOnly = true)
    public ReservationDTO findById(String email, Integer reservationId) {
        Reservation reservation = requireById(reservationId);
        User currentUser = userService.requireByEmail(email);

        boolean isOwner = reservation.getUser().getUserId().equals(currentUser.getUserId());
        boolean isAdmin = currentUser.getRole() == Role.ADMINISTRADOR;

        if (!isOwner && !isAdmin) {
            throw new ForbiddenOperationException(
                    "No esta autorizado para consultar una reserva que no le pertenece");
        }
        return reservationMapper.toDto(reservation);
    }

    @Transactional(readOnly = true)
    public Page<ReservationDTO> findMyReservations(String email, Pageable pageable) {
        User user = userService.requireByEmail(email);
        return reservationRepository.findByUserId(user.getUserId(), pageable)
                .map(reservationMapper::toDto);
    }

    @Transactional(readOnly = true)
    public Page<ReservationDTO> findAll(Pageable pageable) {
        return reservationRepository.findAll(pageable).map(reservationMapper::toDto);
    }

    private Reservation requireById(Integer reservationId) {
        return reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No existe la reserva con id " + reservationId));
    }

    private void refreshEquipmentAvailability(Integer equipmentId) {
        long active = reservationRepository.countActiveByEquipment(equipmentId, ReservationStatus.CREADA);
        LabEquipment equipment = equipmentService.requireById(equipmentId);

        if (active == 0 && equipment.getStatus() == EquipmentStatus.RESERVADO) {
            equipment.setStatus(EquipmentStatus.DISPONIBLE);
            equipmentRepository.save(equipment);
        }
    }
}