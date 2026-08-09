package udea.lis.equipos_reservas_api.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import udea.lis.equipos_reservas_api.dto.TopEquipoResponse;
import udea.lis.equipos_reservas_api.service.EstadisticaService;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(EstadisticaController.class)
class EstadisticaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EstadisticaService estadisticaService;

    @Test
    void top5Devuelve200ConListaOrdenada() throws Exception {
        when(estadisticaService.top5EquiposMasSolicitados()).thenReturn(List.of(
                new TopEquipoResponse(1L, "Arduino Uno", 12L),
                new TopEquipoResponse(2L, "Oculus Quest", 4L)));

        mockMvc.perform(get("/api/estadisticas/top-5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].equipoNombre").value("Arduino Uno"))
                .andExpect(jsonPath("$[0].cantidadReservas").value(12))
                .andExpect(jsonPath("$[1].equipoNombre").value("Oculus Quest"))
                .andExpect(jsonPath("$[1].cantidadReservas").value(4));
    }
}
