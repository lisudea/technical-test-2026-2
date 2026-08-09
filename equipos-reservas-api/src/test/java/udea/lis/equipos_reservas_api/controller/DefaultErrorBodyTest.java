package udea.lis.equipos_reservas_api.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.webmvc.autoconfigure.error.ErrorMvcAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.util.WebUtils;
import udea.lis.equipos_reservas_api.service.EquipoService;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Verifica que los errores usen el formato de respuesta por defecto de Spring Boot:
// {"timestamp": ..., "status": ..., "error": ..., "path": ...}.
// En MockMvc el forward al controlador /error no ocurre automáticamente, por eso se hace el dispatch manual
// con los atributos de error que Spring Boot lee en runtime.
@WebMvcTest(EquipoController.class)
@ImportAutoConfiguration(ErrorMvcAutoConfiguration.class)
class DefaultErrorBodyTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EquipoService equipoService;

    @Test
    void error404UsaElFormatoPorDefecto() throws Exception {
        mockMvc.perform(get("/error")
                        .requestAttr(WebUtils.ERROR_STATUS_CODE_ATTRIBUTE, 404)
                        .requestAttr(WebUtils.ERROR_REQUEST_URI_ATTRIBUTE, "/api/equipos/99")
                        .requestAttr(WebUtils.ERROR_MESSAGE_ATTRIBUTE, "Equipo no encontrado con id 99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.path").value("/api/equipos/99"));
    }

    @Test
    void error409UsaElFormatoPorDefecto() throws Exception {
        mockMvc.perform(get("/error")
                        .requestAttr(WebUtils.ERROR_STATUS_CODE_ATTRIBUTE, 409)
                        .requestAttr(WebUtils.ERROR_REQUEST_URI_ATTRIBUTE, "/api/reservas")
                        .requestAttr(WebUtils.ERROR_MESSAGE_ATTRIBUTE, "El equipo ya está reservado en el horario solicitado"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.path").value("/api/reservas"));
    }

    @Test
    void error400UsaElFormatoPorDefecto() throws Exception {
        mockMvc.perform(get("/error")
                        .requestAttr(WebUtils.ERROR_STATUS_CODE_ATTRIBUTE, 400)
                        .requestAttr(WebUtils.ERROR_REQUEST_URI_ATTRIBUTE, "/api/equipos")
                        .requestAttr(WebUtils.ERROR_MESSAGE_ATTRIBUTE, "Validación fallida"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.path").value("/api/equipos"));
    }
}
