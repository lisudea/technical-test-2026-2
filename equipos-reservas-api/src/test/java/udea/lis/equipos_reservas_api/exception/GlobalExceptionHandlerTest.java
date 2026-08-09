package udea.lis.equipos_reservas_api.exception;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import udea.lis.equipos_reservas_api.controller.EquipoController;
import udea.lis.equipos_reservas_api.service.EquipoService;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Verifica que el GlobalExceptionHandler devuelva un body de error uniforme y legible para el frontend:
// {"status", "error", "message", "path", "timestamp"} y, en validaciones, la lista de errores por campo.
@WebMvcTest(EquipoController.class)
class GlobalExceptionHandlerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EquipoService equipoService;

    @Test
    void error404IncluyeMensajeYPath() throws Exception {
        when(equipoService.consultarPorId(99L))
                .thenThrow(new RecursoNoEncontradoException("Equipo no encontrado con id 99"));

        mockMvc.perform(get("/api/equipos/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Equipo no encontrado con id 99"))
                .andExpect(jsonPath("$.path").value("/api/equipos/99"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void error409IncluyeMensaje() throws Exception {
        when(equipoService.registrar(any()))
                .thenThrow(new RecursoDuplicadoException("Ya existe un equipo con el id 1"));

        mockMvc.perform(post("/api/equipos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "id": 1,
                                  "nombre": "Arduino Uno",
                                  "numeroSerie": "SN-001",
                                  "categoria": "MICROCONTROLADORES",
                                  "estado": "DISPONIBLE"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("Ya existe un equipo con el id 1"))
                .andExpect(jsonPath("$.path").value("/api/equipos"));
    }

    @Test
    void error400DeValidacionListaErroresPorCampo() throws Exception {
        mockMvc.perform(post("/api/equipos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nombre": "Arduino Uno",
                                  "numeroSerie": "SN-001",
                                  "categoria": "MICROCONTROLADORES",
                                  "estado": "DISPONIBLE"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Los datos enviados no son válidos"))
                .andExpect(jsonPath("$.errors[0].campo").value("id"))
                .andExpect(jsonPath("$.errors[0].mensaje").value("El id del equipo es obligatorio"))
                .andExpect(jsonPath("$.path").value("/api/equipos"));
    }

    @Test
    void error400DeParametroInvalidoIncluyeMensaje() throws Exception {
        mockMvc.perform(get("/api/equipos").param("categoria", "INEXISTENTE"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("El parámetro 'categoria' no es válido"))
                .andExpect(jsonPath("$.path").value("/api/equipos"));
    }

    @Test
    void error500FallbackNoExponeDetallesInternos() throws Exception {
        when(equipoService.consultarPorId(1L)).thenThrow(new RuntimeException("detalle interno sensible"));

        mockMvc.perform(get("/api/equipos/1"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.message").value("Ocurrió un error inesperado en el servidor"));
    }
}
