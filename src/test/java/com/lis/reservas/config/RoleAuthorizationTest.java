package com.lis.reservas.config;

import com.lis.reservas.admin.AdminController;
import com.lis.reservas.admin.service.AdminService;
import com.lis.reservas.auth.JwtAuthenticationFilter;
import com.lis.reservas.auth.JwtTokenProvider;
import com.lis.reservas.common.dto.PagedResponse;
import com.lis.reservas.equipo.EquipoController;
import com.lis.reservas.equipo.dto.EquipoResponse;
import com.lis.reservas.equipo.entity.EstadoEquipo;
import com.lis.reservas.equipo.service.EquipoService;
import com.lis.reservas.prestamo.PrestamoController;
import com.lis.reservas.prestamo.service.PrestamoService;
import com.lis.reservas.sancion.SancionController;
import com.lis.reservas.sancion.service.SancionService;
import com.lis.reservas.usuario.entity.Rol;
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
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Exercises the role matrix through the REAL {@link SecurityConfig} and a
 * REAL {@link JwtTokenProvider}, so the tokens carry genuine {@code rol}
 * claims and the filter derives genuine authorities.
 *
 * <p>This is the test that would have caught the whole class of bug where
 * roles exist in the database and in the DTOs but never reach Spring
 * Security — a token with no authority passes {@code authenticated()} and
 * fails every {@code hasRole} check, so an admin console would 403 against
 * its own administrator.
 *
 * <p>Each privileged surface is probed from three angles: the role that
 * should be refused, and the role(s) that should be allowed. Only the status
 * code matters here; the handlers are mocked.
 */
@WebMvcTest(controllers = {AdminController.class, PrestamoController.class,
        SancionController.class, EquipoController.class},
        excludeAutoConfiguration = {
                OAuth2ClientAutoConfiguration.class,
                OAuth2ResourceServerAutoConfiguration.class})
@Import({SecurityConfig.class, RoleAuthorizationTest.SecurityBeans.class})
class RoleAuthorizationTest {

    private static final String SECRET = "test-secret-must-be-at-least-32-bytes-long-xxxxx";

    @Autowired
    private MockMvc mockMvc;

    /** The same provider the filter chain uses, so the signature verifies. */
    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private AdminService adminService;

    @MockBean
    private PrestamoService prestamoService;

    @MockBean
    private SancionService sancionService;

    @MockBean
    private EquipoService equipoService;

    @TestConfiguration
    static class SecurityBeans {
        @Bean
        JwtTokenProvider jwtTokenProvider() {
            return new JwtTokenProvider(SECRET, 30);
        }
    }

    // =================================================================
    // /admin — ADMIN only
    // =================================================================

    @Test
    void adminSurface_rejectsEstudiante() throws Exception {
        mockMvc.perform(as(get("/api/v1/admin/resumen"), Rol.ESTUDIANTE))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminSurface_rejectsAuxiliar() throws Exception {
        mockMvc.perform(as(get("/api/v1/admin/resumen"), Rol.AUXILIAR))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminSurface_allowsAdmin() throws Exception {
        given(adminService.resumen()).willReturn(null);

        mockMvc.perform(as(get("/api/v1/admin/resumen"), Rol.ADMIN))
                .andExpect(status().isOk());
    }

    @Test
    void adminSurface_rejectsAnonymousWith401NotForbidden() throws Exception {
        // Unauthenticated is 401 (who are you?), authenticated-but-wrong-role
        // is 403 (I know who you are, and no). Collapsing them would tell a
        // logged-in user to log in again.
        mockMvc.perform(get("/api/v1/admin/resumen"))
                .andExpect(status().isUnauthorized());
    }

    // =================================================================
    // /prestamos — AUXILIAR and ADMIN
    // =================================================================

    @Test
    void loanDesk_rejectsEstudiante() throws Exception {
        mockMvc.perform(as(get("/api/v1/prestamos/agenda"), Rol.ESTUDIANTE))
                .andExpect(status().isForbidden());
    }

    @Test
    void loanDesk_allowsAuxiliar() throws Exception {
        given(prestamoService.agenda(any(), any(), any()))
                .willReturn(new PagedResponse<>(List.of(), 0, 0, 0, 20));

        mockMvc.perform(as(get("/api/v1/prestamos/agenda"), Rol.AUXILIAR))
                .andExpect(status().isOk());
    }

    @Test
    void loanDesk_allowsAdmin() throws Exception {
        given(prestamoService.agenda(any(), any(), any()))
                .willReturn(new PagedResponse<>(List.of(), 0, 0, 0, 20));

        mockMvc.perform(as(get("/api/v1/prestamos/agenda"), Rol.ADMIN))
                .andExpect(status().isOk());
    }

    // =================================================================
    // /sanciones — staff read, admin write, own read for anyone
    // =================================================================

    @Test
    void sanciones_writeRejectsAuxiliar() throws Exception {
        mockMvc.perform(as(post("/api/v1/sanciones"), Rol.AUXILIAR)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idUsuario\":1,\"motivo\":\"x\",\"dias\":3}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void sanciones_staffListingRejectsEstudiante() throws Exception {
        mockMvc.perform(as(get("/api/v1/sanciones"), Rol.ESTUDIANTE))
                .andExpect(status().isForbidden());
    }

    @Test
    void sanciones_ownListingIsOpenToAnyAuthenticatedUser() throws Exception {
        given(sancionService.misSanciones(any()))
                .willReturn(new PagedResponse<>(List.of(), 0, 0, 0, 20));

        // The narrow /mias matcher must be declared before the broad
        // /sanciones/** one; first match wins, so ordering is load-bearing.
        mockMvc.perform(as(get("/api/v1/sanciones/mias"), Rol.ESTUDIANTE))
                .andExpect(status().isOk());
    }

    // =================================================================
    // /equipos — catalog write is ADMIN, estado patch is staff-wide
    // =================================================================

    @Test
    void equipos_createRejectsAuxiliar() throws Exception {
        mockMvc.perform(as(post("/api/v1/equipos"), Rol.AUXILIAR)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"X\",\"idCategoria\":1}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void equipos_estadoPatchAllowsAuxiliar() throws Exception {
        given(equipoService.patchEstado(any(), any())).willReturn(unEquipo());

        // An auxiliar sends equipment to maintenance from the loan desk, so
        // this narrow patch is deliberately wider than full catalog CRUD.
        mockMvc.perform(as(patch("/api/v1/equipos/1/estado"), Rol.AUXILIAR)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estado\":\"MANTENIMIENTO\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void equipos_estadoPatchRejectsEstudiante() throws Exception {
        mockMvc.perform(as(patch("/api/v1/equipos/1/estado"), Rol.ESTUDIANTE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estado\":\"MANTENIMIENTO\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void equipos_listStaysPublic() throws Exception {
        given(equipoService.findPaginated(any(), any(), any(), any()))
                .willReturn(new PagedResponse<>(List.of(), 0, 0, 0, 20));

        mockMvc.perform(get("/api/v1/equipos"))
                .andExpect(status().isOk());
    }

    // --- helpers -----------------------------------------------------

    /** Attach a genuinely signed Bearer token carrying {@code rol}. */
    private MockHttpServletRequestBuilder as(MockHttpServletRequestBuilder request, Rol rol) {
        String token = jwtTokenProvider.generateToken(
                rol.name().toLowerCase() + "@udea.edu.co", "Test User", rol);
        return request.header("Authorization", "Bearer " + token);
    }

    private static EquipoResponse unEquipo() {
        return new EquipoResponse(1, "Arduino", "ARD-1", null, null,
                EstadoEquipo.MANTENIMIENTO, 1, "Microcontroladores", null, null);
    }
}
