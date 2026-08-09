package com.lis.reservas.auth;

import com.lis.reservas.auth.dto.GoogleAuthRequest;
import com.lis.reservas.auth.dto.PerfilResponse;
import com.lis.reservas.auth.dto.TokenResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for the {@code /api/v1/auth} resource.
 *
 * <p>Phase 4 wires the real flow: {@code POST /google} validates the Google
 * id_token (enforcing the {@code @udea.edu.co} domain), upserts the
 * {@code usuarios} row by {@code correo} and issues a signed JWT; {@code GET
 * /me} reads the authenticated principal (the correo, set by the JWT filter)
 * and returns the stored profile.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Exchange a Google id_token for a signed JWT.
     */
    @PostMapping("/google")
    public TokenResponse google(@Valid @RequestBody GoogleAuthRequest request) {
        return authService.authenticate(request);
    }

    /**
     * Current user profile derived from the authenticated JWT principal.
     */
    @GetMapping("/me")
    public PerfilResponse me() {
        return authService.getPerfil();
    }
}
