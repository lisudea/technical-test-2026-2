package com.udea.labreservas.mapping;

import com.udea.labreservas.dto.ReservationDTO;
import com.udea.labreservas.entity.Reservation;
import org.springframework.stereotype.Component;

@Component
public class ReservationMapper {

    public ReservationDTO toDto(Reservation reservation) {
        if (reservation == null) {
            return null;
        }
        return new ReservationDTO(
                reservation.getReservationId(),
                reservation.getUser().getUserId(),
                reservation.getUser().getName() + " " + reservation.getUser().getLastName(),
                reservation.getUser().getEmail(),
                reservation.getEquipment().getEquipmentId(),
                reservation.getEquipment().getEquipmentName(),
                reservation.getEquipment().getMacNumber(),
                reservation.getStartTime(),
                reservation.getEndTime(),
                reservation.getStatus()
        );
    }
}