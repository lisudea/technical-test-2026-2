package com.example.lis_equipment_system.service;

import com.example.lis_equipment_system.equipment.entity.enumerator.EquipmentCategory;
import com.example.lis_equipment_system.reservation.entity.enumerator.ReservationStatus;
import com.example.lis_equipment_system.reservation.repository.CategoryReservationCount;
import com.example.lis_equipment_system.reservation.repository.EquipmentReservationCount;
import com.example.lis_equipment_system.reservation.repository.ReservationRepository;
import com.example.lis_equipment_system.stats.dto.CancellationRateResponse;
import com.example.lis_equipment_system.stats.dto.CategoryReservationResponse;
import com.example.lis_equipment_system.stats.dto.TopEquipmentResponse;
import com.example.lis_equipment_system.stats.service.impl.StatsServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.PageRequest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class StatsServiceImplTest {

    @Mock
    private ReservationRepository reservationRepository;

    @InjectMocks
    private StatsServiceImpl statsService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void getTopRequestedEquipmentShouldMapRepositoryData() {
        EquipmentReservationCount count = new EquipmentReservationCount() {
            @Override
            public Long getEquipmentId() { return 5L; }

            @Override
            public String getEquipmentName() { return "Raspberry Pi"; }

            @Override
            public EquipmentCategory getCategory() { return EquipmentCategory.COMPUTO; }

            @Override
            public Long getReservationCount() { return 8L; }
        };

        when(reservationRepository.findTopRequestedEquipment(any(PageRequest.class))).thenReturn(List.of(count));

        List<TopEquipmentResponse> result = statsService.getTopRequestedEquipment();

        assertEquals(1, result.size());
        assertEquals(5L, result.get(0).equipmentId());
        assertEquals("Raspberry Pi", result.get(0).equipmentName());
        assertEquals(EquipmentCategory.COMPUTO, result.get(0).category());
        assertEquals(8L, result.get(0).reservationCount());
    }

    @Test
    void getReservationsByCategoryShouldMapCounts() {
        CategoryReservationCount count = new CategoryReservationCount() {
            @Override
            public EquipmentCategory getCategory() { return EquipmentCategory.REDES; }

            @Override
            public Long getReservationCount() { return 3L; }
        };

        when(reservationRepository.countReservationsByCategory()).thenReturn(List.of(count));

        List<CategoryReservationResponse> result = statsService.getReservationsByCategory();

        assertEquals(1, result.size());
        assertEquals(EquipmentCategory.REDES, result.get(0).category());
        assertEquals(3L, result.get(0).reservationCount());
    }

    @Test
    void getCancellationRateShouldComputeRoundedPercentage() {
        when(reservationRepository.count()).thenReturn(10L);
        when(reservationRepository.countByStatus(ReservationStatus.CANCELLED)).thenReturn(2L);
        when(reservationRepository.countByStatus(ReservationStatus.ACTIVE)).thenReturn(8L);

        CancellationRateResponse result = statsService.getCancellationRate();

        assertEquals(10L, result.totalReservations());
        assertEquals(8L, result.activeReservations());
        assertEquals(2L, result.cancelledReservations());
        assertEquals(20.0, result.cancellationRatePercentage());
    }
}
