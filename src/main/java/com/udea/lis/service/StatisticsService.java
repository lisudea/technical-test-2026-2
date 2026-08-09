package com.udea.lis.service;

import com.udea.lis.dto.response.TopEquipmentResponse;
import com.udea.lis.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final ReservationRepository reservationRepository;

    public List<TopEquipmentResponse> getTop5Equipment() {
        return reservationRepository.findTop5Equipment().stream()
                .map(row -> TopEquipmentResponse.builder()
                        .equipmentId(((Number) row[0]).longValue())
                        .equipmentName((String) row[1])
                        .serialNumber((String) row[2])
                        .reservationCount(((Number) row[3]).longValue())
                        .build())
                .collect(Collectors.toList());
    }
}
