package com.lis.reservas.auth;

import com.lis.reservas.auth.dto.GoogleAuthRequest;
import com.lis.reservas.auth.dto.PerfilResponse;
import com.lis.reservas.usuario.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

/**
 * REST controller for the {@code /api/v1/auth} resource.
 *
 * <p>Phase 3 only scaffolds the contract: {@code POST /google} is a
 * placeholder that signals the Google SSO flow is not wired yet (Phase 4 will
 * validate the id_token against the configured client id, enforce the
 * allowed email domain, and issue a signed JWT). {@code GET /me} already
 * reads the authenticated principal from the {@link SecurityContextHolder};
 * it returns a meaningful 403 until Phase 4 populates the context with a JWT
 * principal (the correo is the identity key, used to upsert/lookup the
 * usuario).
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UsuarioService usuarioService;

    /**
     * Exchange a Google id_token for a signed JWT. Placeholder until Phase 4.
     */
    @PostMapping("/google")
    public ResponseEntity<ProblemDetail> google(@Valid @RequestBody GoogleAuthRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_IMPLEMENTED,
                "Autenticacion con Google no configurada aun");
        problem.setType(URI.create("https://lis.udea.edu.co/errors/auth-no-configurado"));
        problem.setTitle("Auth no configurado");
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(problem);
    }

    /**
     * Current user profile. Requires an authenticated principal (Phase 4 JWT
     * sets the correo as principal). Throws 403 until then.
     */
    @GetMapping("/me")
    public PerfilResponse me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()
                || "anonymousUser".equals(auth.getPrincipal())) {
            throw new AccessDeniedException("No hay una sesion autenticada");
        }
        String correo = (String) auth.getPrincipal();
        // Upert/lookup the usuario to resolve the display name; the correo is
        // the identity key once Phase 4 verifies it.
        var usuario = usuarioService.findByCorreo(correo);
        return new PerfilResponse(usuario.nombre(), usuario.correo());
    }
}
