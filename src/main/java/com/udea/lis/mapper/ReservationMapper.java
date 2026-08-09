package com.udea.lis.mapper;

import com.udea.lis.dto.response.ReservationResponse;
import com.udea.lis.entity.Reservation;
import org.springframework.stereotype.Component;

@Component
public class ReservationMapper {

    public ReservationResponse toResponse(Reservation reservation) {
        return ReservationResponse.builder()
                .id(reservation.getId())
                .equipment(ReservationResponse.EquipmentSummary.builder()
                        .id(reservation.getEquipment().getId())
                        .name(reservation.getEquipment().getName())
                        .serialNumber(reservation.getEquipment().getSerialNumber())
                        .build())
                .user(ReservationResponse.UserSummary.builder()
                        .id(reservation.getUser().getId())
                        .name(reservation.getUser().getName())
                        .email(reservation.getUser().getEmail())
                        .build())
                .startTime(reservation.getStartTime())
                .endTime(reservation.getEndTime())
                .createdAt(reservation.getCreatedAt())
                .status(reservation.getStatus())
                .build();
    }
}
