package com.example.lis_equipment_system.service;

import com.example.lis_equipment_system.common.exception.ReservationConflictException;
import com.example.lis_equipment_system.common.exception.ResourceNotFoundException;
import com.example.lis_equipment_system.equipment.entity.Equipment;
import com.example.lis_equipment_system.equipment.entity.enumerator.EquipmentCategory;
import com.example.lis_equipment_system.equipment.entity.enumerator.EquipmentStatus;
import com.example.lis_equipment_system.equipment.repository.EquipmentRepository;
import com.example.lis_equipment_system.reservation.dto.ReservationRequest;
import com.example.lis_equipment_system.reservation.dto.ReservationResponse;
import com.example.lis_equipment_system.reservation.entity.Reservation;
import com.example.lis_equipment_system.reservation.entity.enumerator.ReservationStatus;
import com.example.lis_equipment_system.reservation.repository.ReservationRepository;
import com.example.lis_equipment_system.reservation.service.impl.ReservationServiceImpl;
import com.example.lis_equipment_system.user.entity.User;
import com.example.lis_equipment_system.user.entity.enumerator.Role;
import com.example.lis_equipment_system.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ReservationServiceImplTest {

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ReservationServiceImpl reservationService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void createShouldSaveReservationWhenNoOverlapExists() {
        Equipment equipment = new Equipment();
        equipment.setId(1L);
        equipment.setName("Osciloscopio");
        equipment.setCategory(EquipmentCategory.AUDIO_VIDEO);
        equipment.setStatus(EquipmentStatus.DISPONIBLE);

        User user = new User();
        user.setId(2L);
        user.setEmail("student@udea.edu.co");
        user.setName("Ana");
        user.setRole(Role.USER);

        ReservationRequest request = new ReservationRequest(1L, LocalDateTime.now().plusHours(1),
                LocalDateTime.now().plusHours(2));

        Reservation savedReservation = new Reservation();
        savedReservation.setId(10L);
        savedReservation.setEquipment(equipment);
        savedReservation.setUser(user);
        savedReservation.setDateStartTime(request.dateStartTime());
        savedReservation.setDateEndTime(request.dateEndTime());
        savedReservation.setStatus(ReservationStatus.ACTIVE);

        when(equipmentRepository.findById(1L)).thenReturn(Optional.of(equipment));
        when(userRepository.findByEmail("student@udea.edu.co")).thenReturn(Optional.of(user));
        when(reservationRepository.overlaps(anyLong(), any(), any(), any())).thenReturn(false);
        when(reservationRepository.save(any(Reservation.class))).thenReturn(savedReservation);

        ReservationResponse response = reservationService.create(request, "student@udea.edu.co");

        assertNotNull(response);
        assertEquals(10L, response.id());
        assertEquals("Osciloscopio", response.equipmentName());
        assertEquals("Ana", response.userName());
        assertEquals(ReservationStatus.ACTIVE, response.status());
        verify(reservationRepository).save(any(Reservation.class));
    }

    @Test
    void createShouldThrowConflictWhenOverlapExists() {
        Equipment equipment = new Equipment();
        equipment.setId(1L);
        equipment.setName("Osciloscopio");
        equipment.setCategory(EquipmentCategory.AUDIO_VIDEO);
        equipment.setStatus(EquipmentStatus.DISPONIBLE);

        User user = new User();
        user.setId(2L);
        user.setEmail("student@udea.edu.co");
        user.setName("Ana");
        user.setRole(Role.USER);

        ReservationRequest request = new ReservationRequest(1L, LocalDateTime.now().plusHours(1),
                LocalDateTime.now().plusHours(2));

        when(equipmentRepository.findById(1L)).thenReturn(Optional.of(equipment));
        when(userRepository.findByEmail("student@udea.edu.co")).thenReturn(Optional.of(user));
        when(reservationRepository.overlaps(anyLong(), any(), any(), any())).thenReturn(true);

        ReservationConflictException exception = assertThrows(ReservationConflictException.class,
                () -> reservationService.create(request, "student@udea.edu.co"));

        assertTrue(exception.getMessage().contains("reservado"));
        verify(reservationRepository, never()).save(any(Reservation.class));
    }

    @Test
    void cancelShouldAllowOwnerAndAdminToCancel() {
        Reservation reservation = new Reservation();
        reservation.setId(4L);
        reservation.setStatus(ReservationStatus.ACTIVE);
        User owner = new User();
        owner.setEmail("owner@udea.edu.co");
        reservation.setUser(owner);

        User admin = new User();
        admin.setEmail("admin@udea.edu.co");
        admin.setRole(Role.ADMIN);

        when(reservationRepository.findById(4L)).thenReturn(Optional.of(reservation));
        when(userRepository.findByEmail("admin@udea.edu.co")).thenReturn(Optional.of(admin));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        reservationService.cancel(4L, "admin@udea.edu.co");

        assertEquals(ReservationStatus.CANCELLED, reservation.getStatus());
        verify(reservationRepository).save(reservation);
    }

    @Test
    void cancelShouldThrowWhenUserIsNeitherOwnerNorAdmin() {
        Reservation reservation = new Reservation();
        reservation.setId(4L);
        reservation.setStatus(ReservationStatus.ACTIVE);
        User owner = new User();
        owner.setEmail("owner@udea.edu.co");
        reservation.setUser(owner);

        User regularUser = new User();
        regularUser.setEmail("other@udea.edu.co");
        regularUser.setRole(Role.USER);

        when(reservationRepository.findById(4L)).thenReturn(Optional.of(reservation));
        when(userRepository.findByEmail("other@udea.edu.co")).thenReturn(Optional.of(regularUser));

        AccessDeniedException exception = assertThrows(AccessDeniedException.class,
                () -> reservationService.cancel(4L, "other@udea.edu.co"));

        assertTrue(exception.getMessage().contains("permiso"));
        verify(reservationRepository, never()).save(any(Reservation.class));
    }

    @Test
    void findAllShouldReturnMappedReservations() {
        Reservation reservation = new Reservation();
        reservation.setId(11L);
        Equipment equipment = new Equipment();
        equipment.setId(2L);
        equipment.setName("Proyector");
        reservation.setEquipment(equipment);
        User user = new User();
        user.setName("Luis");
        user.setEmail("luis@udea.edu.co");
        reservation.setUser(user);
        reservation.setDateStartTime(LocalDateTime.now());
        reservation.setDateEndTime(LocalDateTime.now().plusHours(1));
        reservation.setStatus(ReservationStatus.ACTIVE);
        reservation.setCreationDate(LocalDateTime.now());

        Page<Reservation> page = new PageImpl<>(List.of(reservation));
        when(reservationRepository.findAll(any(PageRequest.class))).thenReturn(page);

        Page<ReservationResponse> responsePage = reservationService.findAll(null, PageRequest.of(0, 10));

        assertEquals(1, responsePage.getContent().size());
        assertEquals("Proyector", responsePage.getContent().get(0).equipmentName());
        verify(reservationRepository).findAll(any(PageRequest.class));
    }
}
