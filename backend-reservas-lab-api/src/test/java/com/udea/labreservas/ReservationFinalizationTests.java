package com.udea.labreservas;

import com.udea.labreservas.dto.CreateReservationDTO;
import com.udea.labreservas.dto.ReservationDTO;
import com.udea.labreservas.entity.EquipmentStatus;
import com.udea.labreservas.entity.LabEquipment;
import com.udea.labreservas.entity.ReservationStatus;
import com.udea.labreservas.repository.LabEquipmentRepository;
import com.udea.labreservas.repository.ReservationRepository;
import com.udea.labreservas.service.ReservationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
class ReservationFinalizationTests {

    @Autowired
    private ReservationService reservationService;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private LabEquipmentRepository equipmentRepository;

    @Test
    void finalizacionMarcaReservasVencidasYLiberaElEquipo() {
        LabEquipment equipment = equipmentRepository.findAll().stream()
                .filter(e -> e.getStatus() == EquipmentStatus.DISPONIBLE)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No hay equipos disponibles de semilla"));

        CreateReservationDTO expired = new CreateReservationDTO(
                equipment.getEquipmentId(),
                LocalDateTime.now().minusDays(3),
                LocalDateTime.now().minusDays(2));

        ReservationDTO created = reservationService.create("estudiante@udea.edu.co", expired);
        assertEquals(ReservationStatus.CREADA, created.status());

        reservationService.markFinishedReservations();

        assertEquals(ReservationStatus.FINALIZADA,
                reservationRepository.findById(created.reservationId()).orElseThrow().getStatus());

        LabEquipment reloaded = equipmentRepository.findById(equipment.getEquipmentId()).orElseThrow();
        assertEquals(EquipmentStatus.DISPONIBLE, reloaded.getStatus());
    }
}