package udea.lis.equipos_reservas_api.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import udea.lis.equipos_reservas_api.dto.EquipoRequest;
import udea.lis.equipos_reservas_api.dto.EquipoResponse;
import udea.lis.equipos_reservas_api.dto.PageResponse;
import udea.lis.equipos_reservas_api.exception.RecursoDuplicadoException;
import udea.lis.equipos_reservas_api.exception.RecursoNoEncontradoException;
import udea.lis.equipos_reservas_api.model.CategoriaEquipo;
import udea.lis.equipos_reservas_api.model.EstadoEquipo;
import udea.lis.equipos_reservas_api.service.EquipoService;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(EquipoController.class)
class EquipoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EquipoService equipoService;

    private static final String EQUIPO_JSON = """
            {
              "id": 1,
              "nombre": "Arduino Uno",
              "numeroSerie": "SN-001",
              "categoria": "MICROCONTROLADORES",
              "estado": "DISPONIBLE"
            }
            """;

    private EquipoResponse response() {
        return new EquipoResponse(1L, "Arduino Uno", "SN-001", CategoriaEquipo.MICROCONTROLADORES, EstadoEquipo.DISPONIBLE);
    }

    @Test
    void registrarDevuelve201() throws Exception {
        when(equipoService.registrar(any(EquipoRequest.class))).thenReturn(response());

        mockMvc.perform(post("/api/equipos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(EQUIPO_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nombre").value("Arduino Uno"))
                .andExpect(jsonPath("$.categoria").value("MICROCONTROLADORES"))
                .andExpect(jsonPath("$.estado").value("DISPONIBLE"));
    }

    @Test
    void registrarConIdDuplicadoDevuelve409() throws Exception {
        when(equipoService.registrar(any(EquipoRequest.class)))
                .thenThrow(new RecursoDuplicadoException("Ya existe un equipo con el id 1"));

        mockMvc.perform(post("/api/equipos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(EQUIPO_JSON))
                .andExpect(status().isConflict());
    }

    @Test
    void registrarSinIdDevuelve400() throws Exception {
        String body = """
                {
                  "nombre": "Arduino Uno",
                  "numeroSerie": "SN-001",
                  "categoria": "MICROCONTROLADORES",
                  "estado": "DISPONIBLE"
                }
                """;

        mockMvc.perform(post("/api/equipos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void actualizarDevuelve200() throws Exception {
        when(equipoService.actualizar(any(EquipoRequest.class))).thenReturn(response());

        mockMvc.perform(put("/api/equipos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(EQUIPO_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.numeroSerie").value("SN-001"));
    }

    @Test
    void consultarPorIdDevuelve200() throws Exception {
        when(equipoService.consultarPorId(1L)).thenReturn(response());

        mockMvc.perform(get("/api/equipos/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void consultarPorIdInexistenteDevuelve404() throws Exception {
        when(equipoService.consultarPorId(99L))
                .thenThrow(new RecursoNoEncontradoException("Equipo no encontrado con id 99"));

        mockMvc.perform(get("/api/equipos/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void listarConFiltrosDevuelve200() throws Exception {
        PageResponse<EquipoResponse> page =
                new PageResponse<>(List.of(response()), 0, 10, 1, 1);
        when(equipoService.listarPaginado(eq(CategoriaEquipo.VR), eq(EstadoEquipo.DISPONIBLE), eq(0), eq(10)))
                .thenReturn(page);

        mockMvc.perform(get("/api/equipos")
                        .param("categoria", "VR")
                        .param("estado", "DISPONIBLE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contenido").isArray())
                .andExpect(jsonPath("$.pagina").value(0))
                .andExpect(jsonPath("$.totalElementos").value(1));
    }

    @Test
    void listarConCategoriaInvalidaDevuelve400() throws Exception {
        mockMvc.perform(get("/api/equipos").param("categoria", "INEXISTENTE"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listarConTamanioMayorAlTopeSeLimitaA100() throws Exception {
        PageResponse<EquipoResponse> page =
                new PageResponse<>(List.of(response()), 0, 100, 1, 1);
        when(equipoService.listarPaginado(eq(null), eq(null), eq(0), eq(100))).thenReturn(page);

        mockMvc.perform(get("/api/equipos").param("size", "200"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tamano").value(100));
    }
}
