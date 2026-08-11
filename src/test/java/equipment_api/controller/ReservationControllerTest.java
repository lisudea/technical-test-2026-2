package equipment_api.controller;

import equipment_api.entity.Equipment;
import equipment_api.entity.EquipmentCategory;
import equipment_api.entity.EquipmentStatus;
import equipment_api.entity.Reservation;
import equipment_api.entity.ReservationStatus;
import equipment_api.entity.User;
import equipment_api.exception.EquipmentNotFoundException;
import equipment_api.exception.GlobalExceptionHandler;
import equipment_api.exception.ReservationConflictException;
import equipment_api.service.ReservationService;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Comprueba el CONTRATO HTTP de la API de reservas: que cada situacion se
 * traduzca al codigo de estado correcto y que el cuerpo del error tenga
 * siempre la misma forma (el frontend depende de ello).
 *
 * Se desactivan los filtros de seguridad para probar el controlador y el
 * manejador de excepciones de forma aislada.
 */
@WebMvcTest(ReservationController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
@DisplayName("ReservationController (contrato HTTP)")
class ReservationControllerTest {

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    @Autowired private MockMvc mockMvc;

    @MockitoBean private ReservationService reservationService;

    private String body(LocalDateTime start, LocalDateTime end) {
        return """
            {
              "equipmentId": 1,
              "userName": "Carlos",
              "userEmail": "carlos@udea.edu.co",
              "startTime": "%s",
              "endTime": "%s"
            }
            """.formatted(start.format(ISO), end.format(ISO));
    }

    private LocalDateTime at(int hour) {
        return LocalDateTime.now().plusDays(1).withHour(hour).withMinute(0).withSecond(0).withNano(0);
    }

    // ------------------------------------------------------------------

    @Test
    @DisplayName("201 cuando la reserva se crea correctamente")
    void createsReservation() throws Exception {

        when(reservationService.createReservation(anyLong(), any(), any(), any(), any(), any()))
                .thenReturn(sampleReservation());

        mockMvc.perform(post("/api/reservations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(at(10), at(11))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.equipmentName").value("Arduino Uno R3"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    @DisplayName("409 cuando el equipo ya esta reservado en esa franja (REGLA CRITICA)")
    void returnsConflictWhenOverlapping() throws Exception {

        when(reservationService.createReservation(anyLong(), any(), any(), any(), any(), any()))
                .thenThrow(new ReservationConflictException(1L));

        mockMvc.perform(post("/api/reservations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(at(10), at(11))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value(
                        org.hamcrest.Matchers.containsString("ya tiene una reserva")))
                .andExpect(jsonPath("$.path").value("/api/reservations"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    @DisplayName("400 con detalle por campo cuando faltan datos obligatorios")
    void returnsValidationErrors() throws Exception {

        mockMvc.perform(post("/api/reservations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"userName\": \"Carlos\" }"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors").isArray())
                .andExpect(jsonPath("$.errors[0].field").exists())
                .andExpect(jsonPath("$.errors[0].message").exists());
    }

    @Test
    @DisplayName("400 cuando las fechas estan en el pasado")
    void rejectsPastDates() throws Exception {

        LocalDateTime past = LocalDateTime.now().minusDays(2);

        mockMvc.perform(post("/api/reservations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(past, past.plusHours(1))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    @DisplayName("404 cuando el equipo no existe")
    void returnsNotFoundForMissingEquipment() throws Exception {

        when(reservationService.createReservation(anyLong(), any(), any(), any(), any(), any()))
                .thenThrow(new EquipmentNotFoundException(99L));

        mockMvc.perform(post("/api/reservations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(at(10), at(11))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @DisplayName("204 al cancelar una reserva propia")
    void cancelsReservation() throws Exception {

        mockMvc.perform(delete("/api/reservations/1").param("email", "carlos@udea.edu.co"))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("403 al intentar cancelar la reserva de otra persona")
    void rejectsCancellingSomeoneElsesReservation() throws Exception {

        doThrow(new AccessDeniedException("Solo puedes cancelar las reservas creadas con tu propio correo"))
                .when(reservationService).cancelReservation(anyLong(), anyString());

        mockMvc.perform(delete("/api/reservations/1").param("email", "otro@udea.edu.co"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value(
                        org.hamcrest.Matchers.containsString("tu propio correo")));
    }

    // ------------------------------------------------------------------

    private Reservation sampleReservation() {

        Equipment equipment = new Equipment();
        equipment.setId(1L);
        equipment.setName("Arduino Uno R3");
        equipment.setSerialNumber("MCU-ARD-0001");
        equipment.setCategory(EquipmentCategory.MICROCONTROLLERS);
        equipment.setStatus(EquipmentStatus.AVAILABLE);

        User user = new User("Carlos", "carlos@udea.edu.co");
        user.setId(10L);

        Reservation reservation = new Reservation();
        reservation.setId(1L);
        reservation.setEquipment(equipment);
        reservation.setUser(user);
        reservation.setStartTime(at(10));
        reservation.setEndTime(at(11));
        reservation.setStatus(ReservationStatus.ACTIVE);

        return reservation;
    }
}