package com.lis.reservas.config;

import com.lis.reservas.auth.AuthService;
import com.lis.reservas.auth.JwtAuthenticationFilter;
import com.lis.reservas.auth.JwtTokenProvider;
import com.lis.reservas.auth.dto.TokenResponse;
import com.lis.reservas.categoria.CategoriaController;
import com.lis.reservas.categoria.dto.CategoriaResponse;
import com.lis.reservas.categoria.service.CategoriaService;
import com.lis.reservas.common.dto.PagedResponse;
import com.lis.reservas.equipo.EquipoController;
import com.lis.reservas.equipo.service.EquipoService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.oauth2.client.servlet.OAuth2ClientAutoConfiguration;
import org.springframework.boot.autoconfigure.security.oauth2.resource.servlet.OAuth2ResourceServerAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Web slice test that imports the REAL {@link SecurityConfig} so the JWT
 * filter chain's authorization rules are exercised end-to-end through
 * MockMvc. {@code OAuth2ClientAutoConfiguration} is excluded to avoid the
 * empty Google client-id validation that breaks the slice context. A real
 * {@link JwtTokenProvider}/{@link JwtAuthenticationFilter} pair is provided
 * (test secret) so the filter runs but — with no Bearer header present — sets
 * no authentication, letting the authorization rules decide 200 vs 401.
 */
@WebMvcTest(controllers = {EquipoController.class, CategoriaController.class,
        com.lis.reservas.auth.AuthController.class},
        excludeAutoConfiguration = {
                OAuth2ClientAutoConfiguration.class,
                OAuth2ResourceServerAutoConfiguration.class})
@Import({SecurityConfig.class, SecurityConfigTest.SecurityBeans.class})
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EquipoService equipoService;

    @MockBean
    private CategoriaService categoriaService;

    @MockBean
    private AuthService authService;

    @TestConfiguration
    static class SecurityBeans {
        @Bean
        JwtTokenProvider jwtTokenProvider() {
            return new JwtTokenProvider(
                    "test-secret-must-be-at-least-32-bytes-long-xxxxx", 30);
        }
    }

    @Test
    void getEquiposListIsPublic() throws Exception {
        given(equipoService.findPaginated(any(), any(), any(), any()))
                .willReturn(new PagedResponse<>(List.of(), 0, 0, 0, 20));

        mockMvc.perform(get("/api/v1/equipos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void getEquipoByIdIsPublic() throws Exception {
        given(equipoService.findById(1))
                .willReturn(new com.lis.reservas.equipo.dto.EquipoResponse(
                        1, "Arduino", "ARD-1", null, null,
                        com.lis.reservas.equipo.entity.EstadoEquipo.DISPONIBLE,
                        1, "Microcontroladores", null, null));

        mockMvc.perform(get("/api/v1/equipos/1"))
                .andExpect(status().isOk());
    }

    @Test
    void postEquiposRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/v1/equipos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void getCategoriasIsPublic() throws Exception {
        given(categoriaService.findAll())
                .willReturn(List.of(new CategoriaResponse(1, "VR", null)));

        mockMvc.perform(get("/api/v1/categorias"))
                .andExpect(status().isOk());
    }

    @Test
    void postCategoriasRequiresAuthentication() throws Exception {
        mockMvc.perform(post("/api/v1/categorias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"X\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void postAuthGoogleIsPublic() throws Exception {
        given(authService.authenticate(any()))
                .willReturn(new TokenResponse("signed.jwt", "Bearer", 1800L));

        mockMvc.perform(post("/api/v1/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idToken\":\"google-id-token\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("signed.jwt"))
                .andExpect(jsonPath("$.tipo").value("Bearer"));
    }

    @Test
    void getAuthMeRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }
}
