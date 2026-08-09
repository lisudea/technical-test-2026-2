package udea.lis.equipos_reservas_api.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import udea.lis.equipos_reservas_api.dto.PageResponse;
import udea.lis.equipos_reservas_api.dto.ReservaRequest;
import udea.lis.equipos_reservas_api.dto.ReservaResponse;
import udea.lis.equipos_reservas_api.exception.ConflictoReservaException;
import udea.lis.equipos_reservas_api.exception.RecursoNoEncontradoException;
import udea.lis.equipos_reservas_api.model.EstadoReserva;
import udea.lis.equipos_reservas_api.service.ReservaService;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ReservaController.class)
class ReservaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ReservaService reservaService;

    private static final String RESERVA_JSON = """
            {
              "nombreUsuario": "Juan Pérez",
              "correoUsuario": "juan@example.com",
              "equipoId": 1,
              "fechaReserva": "2026-08-10T08:00:00",
              "fechaDevolucion": "2026-08-10T10:00:00"
            }
            """;

    private ReservaResponse responseActiva() {
        return new ReservaResponse(1L,
                LocalDateTime.of(2026, 8, 10, 8, 0),
                LocalDateTime.of(2026, 8, 10, 10, 0),
                EstadoReserva.ACTIVA,
                new ReservaResponse.EquipoResumen(1L, "Arduino Uno"),
                new ReservaResponse.UsuarioResumen("Juan Pérez", "juan@example.com"));
    }

    @Test
    void crearReservaDevuelve201() throws Exception {
        when(reservaService.crearReserva(any(ReservaRequest.class))).thenReturn(responseActiva());

        mockMvc.perform(post("/api/reservas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(RESERVA_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estado").value("ACTIVA"))
                .andExpect(jsonPath("$.equipo.nombre").value("Arduino Uno"))
                .andExpect(jsonPath("$.usuario.correo").value("juan@example.com"));
    }

    @Test
    void crearReservaConSolapamientoDevuelve409() throws Exception {
        when(reservaService.crearReserva(any(ReservaRequest.class)))
                .thenThrow(new ConflictoReservaException("El equipo Arduino Uno ya está reservado en el horario solicitado"));

        mockMvc.perform(post("/api/reservas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(RESERVA_JSON))
                .andExpect(status().isConflict());
    }

    @Test
    void crearReservaSinCorreoDevuelve400() throws Exception {
        String body = """
                {
                  "nombreUsuario": "Juan Pérez",
                  "equipoId": 1,
                  "fechaReserva": "2026-08-10T08:00:00",
                  "fechaDevolucion": "2026-08-10T10:00:00"
                }
                """;

        mockMvc.perform(post("/api/reservas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void cancelarReservaDevuelve200() throws Exception {
        ReservaResponse cancelada = responseActiva();
        cancelada.setEstado(EstadoReserva.CANCELADA);
        when(reservaService.cancelarReserva(1L)).thenReturn(cancelada);

        mockMvc.perform(post("/api/reservas/1/cancelar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("CANCELADA"));
    }

    @Test
    void cancelarReservaInexistenteDevuelve404() throws Exception {
        when(reservaService.cancelarReserva(99L))
                .thenThrow(new RecursoNoEncontradoException("Reserva no encontrada con id 99"));

        mockMvc.perform(post("/api/reservas/99/cancelar"))
                .andExpect(status().isNotFound());
    }

    @Test
    void cancelarReservaYaCanceladaDevuelve409() throws Exception {
        when(reservaService.cancelarReserva(1L))
                .thenThrow(new ConflictoReservaException("La reserva 1 ya está cancelada"));

        mockMvc.perform(post("/api/reservas/1/cancelar"))
                .andExpect(status().isConflict());
    }

    @Test
    void listarReservasConFiltrosDevuelve200() throws Exception {
        PageResponse<ReservaResponse> page =
                new PageResponse<>(List.of(responseActiva()), 0, 10, 1, 1);
        when(reservaService.listarReservas(eq(1L), eq(EstadoReserva.ACTIVA), eq(0), eq(10)))
                .thenReturn(page);

        mockMvc.perform(get("/api/reservas")
                        .param("equipoId", "1")
                        .param("estado", "ACTIVA"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contenido").isArray())
                .andExpect(jsonPath("$.totalElementos").value(1));
    }

    @Test
    void listarReservasConEstadoInvalidoDevuelve400() throws Exception {
        mockMvc.perform(get("/api/reservas").param("estado", "INEXISTENTE"))
                .andExpect(status().isBadRequest());
    }
}
