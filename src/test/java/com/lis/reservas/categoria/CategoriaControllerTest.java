package com.lis.reservas.categoria;

import com.lis.reservas.categoria.dto.CategoriaRequest;
import com.lis.reservas.categoria.dto.CategoriaResponse;
import com.lis.reservas.categoria.service.CategoriaService;
import com.lis.reservas.common.exception.RecursoNoEncontradoException;
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

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * MockMvc slice tests for {@link CategoriaController}.
 *
 * <p>Security filters are disabled ({@code addFilters = false}) because JWT
 * wiring arrives in Phase 4; the {@link CategoriaService} is mocked so the test
 * stays a pure transport-layer (status codes, Location header, RFC 7807 shape)
 * check. The {@link com.lis.reservas.common.GlobalExceptionHandler} advice is
 * picked up automatically by {@code @WebMvcTest}.
 */
@WebMvcTest(controllers = CategoriaController.class,
        excludeAutoConfiguration = {
                SecurityAutoConfiguration.class,
                SecurityFilterAutoConfiguration.class,
                OAuth2ClientAutoConfiguration.class,
                OAuth2ResourceServerAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
class CategoriaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CategoriaService categoriaService;

    @Test
    void getListReturns200AndJsonArray() throws Exception {
        given(categoriaService.findAll()).willReturn(List.of(
                new CategoriaResponse(1, "Microcontroladores", "Arduino"),
                new CategoriaResponse(2, "VR", "Kits de realidad virtual")));

        mockMvc.perform(get("/api/v1/categorias"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].idCategoria").value(1))
                .andExpect(jsonPath("$[1].nombre").value("VR"));
    }

    @Test
    void getByIdReturns200WhenFound() throws Exception {
        given(categoriaService.findById(3)).willReturn(
                new CategoriaResponse(3, "Redes", "Networking"));

        mockMvc.perform(get("/api/v1/categorias/3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idCategoria").value(3))
                .andExpect(jsonPath("$.nombre").value("Redes"));
    }

    @Test
    void getByIdReturns409StyleRfc7807WhenNotFound() throws Exception {
        given(categoriaService.findById(99))
                .willThrow(new RecursoNoEncontradoException("Categoria no encontrada: 99"));

        mockMvc.perform(get("/api/v1/categorias/99"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.detail").value("Categoria no encontrada: 99"))
                .andExpect(jsonPath("$.type").value(
                        org.hamcrest.Matchers.containsString("recurso-no-encontrado")));
    }

    @Test
    void createReturns201WithLocationHeader() throws Exception {
        given(categoriaService.create(any(CategoriaRequest.class)))
                .willReturn(new CategoriaResponse(7, "Impresion 3D", "FDM/SLA"));

        mockMvc.perform(post("/api/v1/categorias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new CategoriaRequest("Impresion 3D", "FDM/SLA"))))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(header().string("Location", org.hamcrest.Matchers.endsWith("/api/v1/categorias/7")))
                .andExpect(jsonPath("$.idCategoria").value(7));
    }

    @Test
    void createReturns400WhenNombreIsBlank() throws Exception {
        mockMvc.perform(post("/api/v1/categorias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nombre": "", "descripcion": "x"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors[0].campo").value("nombre"));
    }

    @Test
    void createReturns400WhenBodyIsMalformedJson() throws Exception {
        mockMvc.perform(post("/api/v1/categorias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{not json"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
    }
}
