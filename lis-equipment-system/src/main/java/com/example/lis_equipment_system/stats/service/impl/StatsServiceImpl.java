package com.example.lis_equipment_system.stats.service.impl;

import com.example.lis_equipment_system.reservation.entity.enumerator.ReservationStatus;
import com.example.lis_equipment_system.reservation.repository.ReservationRepository;
import com.example.lis_equipment_system.stats.dto.CancellationRateResponse;
import com.example.lis_equipment_system.stats.dto.CategoryReservationResponse;
import com.example.lis_equipment_system.stats.dto.TopEquipmentResponse;
import com.example.lis_equipment_system.stats.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StatsServiceImpl implements StatsService {

    private static final int TOP_LIMIT = 5;

    private final ReservationRepository reservationRepository;

    @Override
    public List<TopEquipmentResponse> getTopRequestedEquipment() {
        return reservationRepository.findTopRequestedEquipment(PageRequest.of(0, TOP_LIMIT))
                .stream()
                .map(r -> new TopEquipmentResponse(
                        r.getEquipmentId(), r.getEquipmentName(), r.getCategory(), r.getReservationCount()))
                .toList();
    }

    @Override
    public List<CategoryReservationResponse> getReservationsByCategory() {
        return reservationRepository.countReservationsByCategory().stream()
                .map(r -> new CategoryReservationResponse(r.getCategory(), r.getReservationCount()))
                .toList();
    }

    @Override
    public CancellationRateResponse getCancellationRate() {
        long total = reservationRepository.count();
        long cancelled = reservationRepository.countByStatus(ReservationStatus.CANCELLED);
        long active = reservationRepository.countByStatus(ReservationStatus.ACTIVE);

        double rate = total == 0 ? 0.0 : Math.round((cancelled * 10000.0) / total) / 100.0;

        return new CancellationRateResponse(total, active, cancelled, rate);
    }
}