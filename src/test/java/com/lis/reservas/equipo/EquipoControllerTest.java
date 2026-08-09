package com.lis.reservas.equipo;

import com.lis.reservas.common.dto.PagedResponse;
import com.lis.reservas.common.exception.RecursoNoEncontradoException;
import com.lis.reservas.equipo.dto.EquipoCreateRequest;
import com.lis.reservas.equipo.dto.EquipoResponse;
import com.lis.reservas.equipo.dto.EquipoUpdateRequest;
import com.lis.reservas.equipo.dto.EstadoPatchRequest;
import com.lis.reservas.equipo.entity.EstadoEquipo;
import com.lis.reservas.equipo.service.EquipoService;
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
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * MockMvc slice tests for {@link EquipoController}.
 *
 * <p>The service is mocked; the controller's HTTP contract (paginated listing
 * with filters, 200/404/400/201 statuses, the {@code Location} header and the
 * RFC 7807 problem shape) is what is asserted. Security is disabled until
 * Phase 4 wires the JWT filter chain.
 */
@WebMvcTest(controllers = EquipoController.class,
        excludeAutoConfiguration = {
                SecurityAutoConfiguration.class,
                SecurityFilterAutoConfiguration.class,
                OAuth2ClientAutoConfiguration.class,
                OAuth2ResourceServerAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
class EquipoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private EquipoService equipoService;

    private EquipoResponse sample(int id) {
        return new EquipoResponse(id, "Arduino Uno", "ARD-001",
                "AA:BB:CC:DD:EE:FF", "Kit base", EstadoEquipo.DISPONIBLE,
                1, "Microcontroladores", LocalDateTime.parse("2026-01-01T10:00:00"),
                LocalDateTime.parse("2026-01-01T10:00:00"));
    }

    @Test
    void getPaginatedListReturns200WithEnvelope() throws Exception {
        PagedResponse<EquipoResponse> page = new PagedResponse<>(
                List.of(sample(1), sample(2)), 2, 1, 0, 20);
        given(equipoService.findPaginated(eq("VR"), eq("disponible"),
                eq("arduino"), any())).willReturn(page);

        mockMvc.perform(get("/api/v1/equipos")
                        .param("categoria", "VR")
                        .param("estado", "disponible")
                        .param("nombre", "arduino")
                        .param("page", "0")
                        .param("size", "20")
                        .param("sort", "nombre,asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[0].idEquipo").value(1))
                .andExpect(jsonPath("$.content[1].nombre").value("Arduino Uno"));
    }

    @Test
    void getListReturns200WithNoFilters() throws Exception {
        given(equipoService.findPaginated(eq(null), eq(null), eq(null), any()))
                .willReturn(new PagedResponse<>(List.of(), 0, 0, 0, 20));

        mockMvc.perform(get("/api/v1/equipos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void getByIdReturns200WhenFound() throws Exception {
        given(equipoService.findById(1)).willReturn(sample(1));

        mockMvc.perform(get("/api/v1/equipos/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idEquipo").value(1))
                .andExpect(jsonPath("$.estado").value("DISPONIBLE"));
    }

    @Test
    void getByIdReturns404WhenNotFound() throws Exception {
        given(equipoService.findById(99))
                .willThrow(new RecursoNoEncontradoException("Equipo no encontrado: 99"));

        mockMvc.perform(get("/api/v1/equipos/99"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void createReturns201WithLocation() throws Exception {
        given(equipoService.create(any(EquipoCreateRequest.class)))
                .willReturn(sample(5));

        mockMvc.perform(post("/api/v1/equipos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new EquipoCreateRequest("Arduino Uno", "ARD-001",
                                        "AA:BB:CC:DD:EE:FF", "Kit base", 1))))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location",
                        org.hamcrest.Matchers.endsWith("/api/v1/equipos/5")));
    }

    @Test
    void createReturns400WhenIdCategoriaIsNull() throws Exception {
        mockMvc.perform(post("/api/v1/equipos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nombre": "Arduino Uno", "idCategoria": null}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors[*].campo")
                        .value(org.hamcrest.Matchers.hasItem("idCategoria")));
    }

    @Test
    void updateReturns200() throws Exception {
        given(equipoService.update(eq(1), any(EquipoUpdateRequest.class)))
                .willReturn(sample(1));

        mockMvc.perform(put("/api/v1/equipos/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new EquipoUpdateRequest("Arduino Uno", "ARD-001",
                                        "AA:BB:CC:DD:EE:FF", "Kit base", 1))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idEquipo").value(1));
    }

    @Test
    void patchEstadoReturns200() throws Exception {
        given(equipoService.patchEstado(eq(1), any(EstadoPatchRequest.class)))
                .willReturn(new EquipoResponse(1, "Arduino Uno", "ARD-001",
                        "AA:BB:CC:DD:EE:FF", "Kit base", EstadoEquipo.MANTENIMIENTO,
                        1, "Microcontroladores", null, null));

        mockMvc.perform(patch("/api/v1/equipos/1/estado")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"estado": "MANTENIMIENTO"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("MANTENIMIENTO"));
    }

    @Test
    void patchEstadoReturns400WhenEstadoIsNull() throws Exception {
        mockMvc.perform(patch("/api/v1/equipos/1/estado")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"estado": null}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }
}
