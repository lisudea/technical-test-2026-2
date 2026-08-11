package com.lis.reservas.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
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
    @Operation(summary = "Intercambiar un id_token de Google por un JWT propio (público)",
                description = "Valida el id_token, exige dominio @udea.edu.co, hace upsert del usuario "
                        + "y emite un JWT que lleva el rol como claim.")
        @ApiResponses({
                @ApiResponse(responseCode = "200", description = "JWT emitido"),
                @ApiResponse(responseCode = "400", description = "id_token ausente o malformado"),
                @ApiResponse(responseCode = "403", description = "Correo fuera del dominio permitido o no verificado")
        })
    public TokenResponse google(@Valid @RequestBody GoogleAuthRequest request) {
        return authService.authenticate(request);
    }

    /**
     * Current user profile derived from the authenticated JWT principal.
     */
    @GetMapping("/me")
    @Operation(summary = "Perfil del usuario autenticado",
                description = "Devuelve el rol almacenado en base, que puede ir por delante del claim "
                        + "del token si un ADMIN acaba de cambiarlo.")
        @ApiResponses({
                @ApiResponse(responseCode = "200", description = "Perfil del usuario"),
                @ApiResponse(responseCode = "401", description = "Falta el token o es inválido")
        })
    public PerfilResponse me() {
        return authService.getPerfil();
    }
}
