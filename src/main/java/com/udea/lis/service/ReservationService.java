package com.udea.lis.service;

import com.udea.lis.dto.request.CreateReservationRequest;
import com.udea.lis.dto.response.ReservationResponse;
import com.udea.lis.entity.Equipment;
import com.udea.lis.entity.Reservation;
import com.udea.lis.entity.ReservationStatus;
import com.udea.lis.entity.User;
import com.udea.lis.exception.ReservationConflictException;
import com.udea.lis.exception.ResourceNotFoundException;
import com.udea.lis.mapper.ReservationMapper;
import com.udea.lis.repository.EquipmentRepository;
import com.udea.lis.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final EquipmentRepository equipmentRepository;
    private final UserService userService;
    private final ReservationMapper reservationMapper;

    @Transactional
    public ReservationResponse createReservation(CreateReservationRequest request) {
        validateDates(request.getStartTime(), request.getEndTime());

        Equipment equipment = equipmentRepository.findByIdWithLock(request.getEquipmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment", request.getEquipmentId()));

        User user = userService.findUserById(request.getUserId());

        boolean hasConflict = reservationRepository.existsOverlappingActiveReservation(
                request.getEquipmentId(), request.getStartTime(), request.getEndTime());

        if (hasConflict) {
            throw new ReservationConflictException(request.getEquipmentId());
        }

        Reservation reservation = Reservation.builder()
                .equipment(equipment)
                .user(user)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(ReservationStatus.ACTIVE)
                .build();

        reservation = reservationRepository.save(reservation);

        return reservationMapper.toResponse(reservation);
    }

    @Transactional
    public void cancelReservation(Long id) {
        Reservation reservation = findReservationById(id);
        reservation.setStatus(ReservationStatus.CANCELLED);
        reservationRepository.save(reservation);
    }

    public ReservationResponse getReservation(Long id) {
        Reservation reservation = findReservationById(id);
        return reservationMapper.toResponse(reservation);
    }

    public List<ReservationResponse> getAllReservations() {
        return reservationRepository.findAll().stream()
                .map(reservationMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<ReservationResponse> getReservationsByEquipmentId(Long equipmentId) {
        if (!equipmentRepository.existsById(equipmentId)) {
            throw new ResourceNotFoundException("Equipment", equipmentId);
        }
        return reservationRepository.findByEquipmentId(equipmentId).stream()
                .map(reservationMapper::toResponse)
                .collect(Collectors.toList());
    }

    private Reservation findReservationById(Long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", id));
    }

    private void validateDates(LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime == null || endTime == null) {
            throw new IllegalArgumentException("Start time and end time must not be null");
        }
        if (!startTime.isBefore(endTime)) {
            throw new IllegalArgumentException("Start time must be before end time");
        }
    }
}
