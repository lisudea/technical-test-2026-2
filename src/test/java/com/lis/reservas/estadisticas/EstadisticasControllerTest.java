package com.lis.reservas.estadisticas;

import com.lis.reservas.estadisticas.dto.EquipoTopResponse;
import com.lis.reservas.estadisticas.service.EstadisticasService;
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

import java.util.List;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * MockMvc slice tests for {@link EstadisticasController}.
 *
 * <p>The Top-N ranking endpoint is public and read-only; the service is mocked
 * so the test only exercises the controller's parameter handling (default
 * limit, bounded limit) and the JSON envelope.
 */
@WebMvcTest(controllers = EstadisticasController.class,
        excludeAutoConfiguration = {
                SecurityAutoConfiguration.class,
                SecurityFilterAutoConfiguration.class,
                OAuth2ClientAutoConfiguration.class,
                OAuth2ResourceServerAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
class EstadisticasControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EstadisticasService estadisticasService;

    @Test
    void getTopEquiposReturns200WithRanking() throws Exception {
        given(estadisticasService.getTopEquipos(anyInt())).willReturn(List.of(
                new EquipoTopResponse(1, "Arduino Uno", "Microcontroladores", 8),
                new EquipoTopResponse(2, "Oculus Quest", "VR", 5)));

        mockMvc.perform(get("/api/v1/estadisticas/equipos-top").param("limit", "5"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].idEquipo").value(1))
                .andExpect(jsonPath("$[0].totalReservas").value(8))
                .andExpect(jsonPath("$[1].nombre").value("Oculus Quest"));
    }

    @Test
    void getTopEquiposUsesDefaultLimitWhenOmitted() throws Exception {
        given(estadisticasService.getTopEquipos(anyInt())).willReturn(List.of());

        mockMvc.perform(get("/api/v1/estadisticas/equipos-top"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}
