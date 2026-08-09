package com.lis.reservas.common;

import com.lis.reservas.common.exception.DominioNoAutorizadoException;
import com.lis.reservas.common.exception.EquipoNoDisponibleException;
import com.lis.reservas.common.exception.RecursoNoEncontradoException;
import com.lis.reservas.common.exception.ReservaEnConflictoException;
import com.lis.reservas.common.exception.ValidacionException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Component;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Standalone MockMvc tests for {@link GlobalExceptionHandler}.
 *
 * <p>A throwaway test controller raises each domain and framework exception;
 * the advice is attached via {@code setControllerAdvice}. This isolates the
 * exception&rarr;HTTP&rarr;RFC 7807 mapping from any service/controller logic,
 * so each mapping is verified directly.
 */
class GlobalExceptionHandlerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setup() {
        mockMvc = MockMvcBuilders.standaloneSetup(new TestController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void reservaEnConflictoMapsTo409() throws Exception {
        mockMvc.perform(get("/conflict"))
                .andExpect(status().isConflict())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.type").value(
                        org.hamcrest.Matchers.containsString("reserva-en-conflicto")))
                .andExpect(jsonPath("$.title").value("Conflicto de reserva"));
    }

    @Test
    void equipoNoDisponibleMapsTo409() throws Exception {
        mockMvc.perform(get("/equipo-no-disponible"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.type").value(
                        org.hamcrest.Matchers.containsString("equipo-no-disponible")));
    }

    @Test
    void recursoNoEncontradoMapsTo404() throws Exception {
        mockMvc.perform(get("/no-encontrado"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.type").value(
                        org.hamcrest.Matchers.containsString("recurso-no-encontrado")));
    }

    @Test
    void validacionMapsTo400() throws Exception {
        mockMvc.perform(get("/validacion"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.type").value(
                        org.hamcrest.Matchers.containsString("validacion")));
    }

    @Test
    void dominioNoAutorizadoMapsTo403() throws Exception {
        mockMvc.perform(get("/dominio"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.type").value(
                        org.hamcrest.Matchers.containsString("dominio-no-autorizado")));
    }

    @Test
    void accessDeniedMapsTo403() throws Exception {
        mockMvc.perform(get("/acceso-denegado"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.type").value(
                        org.hamcrest.Matchers.containsString("acceso-denegado")));
    }

    @Test
    void authenticationExceptionMapsTo401() throws Exception {
        mockMvc.perform(get("/no-autenticado"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.type").value(
                        org.hamcrest.Matchers.containsString("no-autenticado")));
    }

    @Test
    void genericExceptionMapsTo500WithSafeMessage() throws Exception {
        mockMvc.perform(get("/generic"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.detail").value("Ocurrio un error inesperado"))
                .andExpect(jsonPath("$.type").value(
                        org.hamcrest.Matchers.containsString("error-interno")));
    }

    @Test
    void methodArgumentNotValidMapsTo400WithFieldErrors() throws Exception {
        mockMvc.perform(post("/valid-body")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": ""}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors[0].campo").value("name"))
                .andExpect(jsonPath("$.errors[0].mensaje").exists());
    }

    @Test
    void httpMessageNotReadableMapsTo400() throws Exception {
        mockMvc.perform(post("/valid-body")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{not json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.type").value(
                        org.hamcrest.Matchers.containsString("cuerpo-no-legible")));
    }

    // ------------------------------------------------------------------
    // Test fixtures
    // ------------------------------------------------------------------

    /**
     * Minimal controller whose endpoints raise the exception under test.
     */
    @Component
    @RestController
    static class TestController {

        @GetMapping("/conflict")
        void conflict() {
            throw new ReservaEnConflictoException("overlap");
        }

        @GetMapping("/equipo-no-disponible")
        void equipoNoDisponible() {
            throw new EquipoNoDisponibleException("en mantenimiento");
        }

        @GetMapping("/no-encontrado")
        void noEncontrado() {
            throw new RecursoNoEncontradoException("no existe");
        }

        @GetMapping("/validacion")
        void validacion() {
            throw new ValidacionException("invalido");
        }

        @GetMapping("/dominio")
        void dominio() {
            throw new DominioNoAutorizadoException("dominio externo");
        }

        @GetMapping("/acceso-denegado")
        void accesoDenegado() {
            throw new AccessDeniedException("denied");
        }

        @GetMapping("/no-autenticado")
        void noAutenticado() {
            throw new BadCredentialsException("bad");
        }

        @GetMapping("/generic")
        void generic() {
            throw new RuntimeException("boom");
        }

        @PostMapping("/valid-body")
        String validBody(@Valid @RequestBody Sample body) {
            return body.name();
        }
    }

    /**
     * Tiny validated record so {@link org.springframework.web.bind.MethodArgumentNotValidException}
     * is raised on an empty name.
     */
    public record Sample(@NotBlank String name) {
    }
}
