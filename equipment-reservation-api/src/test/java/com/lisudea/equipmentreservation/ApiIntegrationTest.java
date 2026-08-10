package com.lisudea.equipmentreservation;

import com.lisudea.equipmentreservation.dto.request.CreateEquipmentRequest;
import com.lisudea.equipmentreservation.dto.request.CreateReservationRequest;
import com.lisudea.equipmentreservation.exception.EquipmentMaintenanceException;
import com.lisudea.equipmentreservation.exception.InvalidReservationException;
import com.lisudea.equipmentreservation.service.EquipmentService;
import com.lisudea.equipmentreservation.service.ReservationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.OffsetDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@ActiveProfiles("test")
class ApiIntegrationTest {

    @Autowired
    private EquipmentService equipmentService;

    @Autowired
    private ReservationService reservationService;

    @Test
    void shouldCreateEquipmentAndReservationSuccessfully() {
        CreateEquipmentRequest equipmentRequest = new CreateEquipmentRequest();
        equipmentRequest.setName("Osciloscopio");
        equipmentRequest.setSerialNumber("SER-100");
        equipmentRequest.setMacAddress(null);
        equipmentRequest.setCategoryId(1L);
        equipmentRequest.setOperationalStatusId(1L);

        var equipment = equipmentService.create(equipmentRequest);
        assertEquals("Osciloscopio", equipment.getName());

        CreateReservationRequest reservationRequest = new CreateReservationRequest();
        reservationRequest.setEquipmentId(equipment.getId());
        reservationRequest.setUserName("Ana");
        reservationRequest.setUserEmail("ana@test.com");
        reservationRequest.setStartAt(OffsetDateTime.now().plusDays(1).withNano(0));
        reservationRequest.setEndAt(OffsetDateTime.now().plusDays(1).plusHours(2).withNano(0));

        var reservation = reservationService.create(reservationRequest);
        assertEquals("Ana", reservation.getUserName());
        var reservations = reservationService.listByEquipment(equipment.getId(), 0, 10);
        assertEquals(1, reservations.getContent().size());
        assertEquals("Ana", reservations.getContent().get(0).getUserName());
    }

    @Test
    void shouldListEquipmentWithCategoryAndOperationalStatus() {
        var response = equipmentService.list(0, 10);

        assertNotNull(response);
        assertNotNull(response.getContent());
        if (!response.getContent().isEmpty()) {
            var firstEquipment = response.getContent().get(0);
            assertNotNull(firstEquipment.getCategory());
            assertNotNull(firstEquipment.getOperationalStatus());
        }
    }

    @Test
    void shouldRejectReservationForMaintenanceEquipment() {
        CreateEquipmentRequest equipmentRequest = new CreateEquipmentRequest();
        equipmentRequest.setName("Switch");
        equipmentRequest.setSerialNumber("SER-200");
        equipmentRequest.setCategoryId(1L);
        equipmentRequest.setOperationalStatusId(2L);

        var equipment = equipmentService.create(equipmentRequest);

        CreateReservationRequest reservationRequest = new CreateReservationRequest();
        reservationRequest.setEquipmentId(equipment.getId());
        reservationRequest.setUserName("Luis");
        reservationRequest.setUserEmail("luis@test.com");
        reservationRequest.setStartAt(OffsetDateTime.now().plusDays(1).withNano(0));
        reservationRequest.setEndAt(OffsetDateTime.now().plusDays(1).plusHours(2).withNano(0));

        assertThrows(EquipmentMaintenanceException.class, () -> reservationService.create(reservationRequest));
    }

    @Test
    void shouldRejectReservationOutsideBusinessHoursInBogotaTimeZone() {
        CreateEquipmentRequest equipmentRequest = new CreateEquipmentRequest();
        equipmentRequest.setName("Microscopio");
        equipmentRequest.setSerialNumber("SER-300");
        equipmentRequest.setCategoryId(1L);
        equipmentRequest.setOperationalStatusId(1L);

        var equipment = equipmentService.create(equipmentRequest);

        CreateReservationRequest reservationRequest = new CreateReservationRequest();
        reservationRequest.setEquipmentId(equipment.getId());
        reservationRequest.setUserName("Marta");
        reservationRequest.setUserEmail("marta@test.com");
        reservationRequest.setStartAt(OffsetDateTime.parse("2026-08-10T06:30:00Z"));
        reservationRequest.setEndAt(OffsetDateTime.parse("2026-08-10T07:30:00Z"));

        assertThrows(InvalidReservationException.class, () -> reservationService.create(reservationRequest));
    }
}
