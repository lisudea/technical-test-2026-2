package com.lis.reservas.reserva;

import com.lis.reservas.common.dto.PagedResponse;
import com.lis.reservas.common.exception.ReservaEnConflictoException;
import com.lis.reservas.common.exception.ValidacionException;
import com.lis.reservas.reserva.dto.ReservaCreateRequest;
import com.lis.reservas.reserva.dto.ReservaResponse;
import com.lis.reservas.reserva.entity.EstadoPrestamo;
import com.lis.reservas.reserva.entity.EstadoReserva;
import com.lis.reservas.reserva.service.ReservaService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.autoconfigure.security.oauth2.client.servlet.OAuth2ClientAutoConfiguration;
import org.springframework.boot.autoconfigure.security.oauth2.resource.servlet.OAuth2ResourceServerAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * MockMvc slice tests for {@link ReservaController}.
 *
 * <p>The conflict (409), validation (400) and success (201) paths are exercised
 * against a mocked {@link ReservaService}, asserting the HTTP contract and the
 * RFC 7807 problem shape. Security filters are disabled until Phase 4.
 */
@WebMvcTest(controllers = ReservaController.class,
        excludeAutoConfiguration = {
                SecurityAutoConfiguration.class,
                SecurityFilterAutoConfiguration.class,
                OAuth2ClientAutoConfiguration.class,
                OAuth2ResourceServerAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
class ReservaControllerTest {

    private static final ZoneOffset BOG = ZoneOffset.ofHours(-5);

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ReservaService reservaService;

    private ReservaResponse sampleResponse(long id, EstadoReserva estado) {
        return new ReservaResponse(id, 1, "Arduino Uno", 10, "Maria Gomez",
                "maria.gomez@udea.edu.co",
                OffsetDateTime.of(2026, 9, 1, 10, 0, 0, 0, BOG),
                OffsetDateTime.of(2026, 9, 1, 12, 0, 0, 0, BOG),
                estado, "Clase de microcontroladores",
                LocalDateTime.parse("2026-08-01T08:00:00"), null,
                EstadoPrestamo.PENDIENTE, null, null, null, null, null);
    }

    private String validCreateJson() {
        return """
                {
                  "nombreUsuario": "Maria Gomez",
                  "correoUsuario": "maria.gomez@udea.edu.co",
                  "idEquipo": 1,
                  "fechaHoraInicio": "2026-09-01T10:00:00-05:00",
                  "fechaHoraFin": "2026-09-01T12:00:00-05:00",
                  "motivo": "Clase"
                }
                """;
    }

    @Test
    void createReturns201WithLocationHeader() throws Exception {
        given(reservaService.create(any(ReservaCreateRequest.class)))
                .willReturn(sampleResponse(42, EstadoReserva.ACTIVA));

        mockMvc.perform(post("/api/v1/reservas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validCreateJson()))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(header().string("Location",
                        org.hamcrest.Matchers.endsWith("/api/v1/reservas/42")))
                .andExpect(jsonPath("$.idReserva").value(42))
                .andExpect(jsonPath("$.estado").value("ACTIVA"));
    }

    @Test
    void createReturns409OnConflict() throws Exception {
        given(reservaService.create(any(ReservaCreateRequest.class)))
                .willThrow(new ReservaEnConflictoException(
                        "Reserva en conflicto: el equipo ya esta reservado en ese horario"));

        mockMvc.perform(post("/api/v1/reservas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validCreateJson()))
                .andExpect(status().isConflict())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.type")
                        .value(org.hamcrest.Matchers.containsString("reserva-en-conflicto")));
    }

    @Test
    void createReturns400OnValidationFailure() throws Exception {
        given(reservaService.create(any(ReservaCreateRequest.class)))
                .willThrow(new ValidacionException("fechaHoraInicio no puede estar en el pasado"));

        mockMvc.perform(post("/api/v1/reservas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validCreateJson()))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.type")
                        .value(org.hamcrest.Matchers.containsString("validacion")));
    }

    @Test
    void createReturns400WhenRequiredFieldMissing() throws Exception {
        mockMvc.perform(post("/api/v1/reservas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nombreUsuario": "", "correoUsuario": "no-email"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors[*].campo")
                        .value(org.hamcrest.Matchers.hasItems(
                                "nombreUsuario", "correoUsuario",
                                "idEquipo", "fechaHoraInicio", "fechaHoraFin")));
    }

    @Test
    void getListReturns200WithEnvelope() throws Exception {
        given(reservaService.list(any(), any(), any(), any(), any(), any()))
                .willReturn(new PagedResponse<>(
                        List.of(sampleResponse(1, EstadoReserva.ACTIVA)), 1, 1, 0, 20));

        mockMvc.perform(get("/api/v1/reservas")
                        .param("idEquipo", "1")
                        .param("estado", "activa"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].idReserva").value(1));
    }

    @Test
    void getByIdReturns200WhenFound() throws Exception {
        given(reservaService.findById(7L)).willReturn(sampleResponse(7, EstadoReserva.ACTIVA));

        mockMvc.perform(get("/api/v1/reservas/7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idReserva").value(7));
    }

    @Test
    void cancelReturns200() throws Exception {
        given(reservaService.cancel(7L))
                .willReturn(sampleResponse(7, EstadoReserva.CANCELADA));

        mockMvc.perform(delete("/api/v1/reservas/7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("CANCELADA"));
    }
}
