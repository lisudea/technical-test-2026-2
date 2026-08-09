package com.lis.reservas.auth;

import com.lis.reservas.auth.dto.GoogleAuthRequest;
import com.lis.reservas.auth.dto.PerfilResponse;
import com.lis.reservas.auth.dto.TokenResponse;
import com.lis.reservas.usuario.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * Orchestrates the Google SSO exchange and the authenticated profile lookup.
 *
 * <p>{@link #authenticate} validates the Google id_token via
 * {@link GoogleTokenValidator} (enforcing the {@code @udea.edu.co} domain),
 * upserts the {@code usuarios} row by {@code correo} and issues a signed JWT
 * through {@link JwtTokenProvider}. {@link #getPerfil} reads the correo from
 * the {@link SecurityContextHolder} (set by the JWT filter) and returns the
 * stored profile.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String BEARER = "Bearer";
    private static final String ANONYMOUS = "anonymousUser";

    private final GoogleTokenValidator googleTokenValidator;
    private final UsuarioService usuarioService;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * Exchange a Google id_token for a signed JWT.
     */
    public TokenResponse authenticate(GoogleAuthRequest request) {
        GoogleTokenValidator.GoogleUserInfo info =
                googleTokenValidator.verify(request.idToken());
        usuarioService.upsertByCorreo(info.email(), info.nombre());
        String token = jwtTokenProvider.generateToken(info.email(), info.nombre());
        return new TokenResponse(token, BEARER, jwtTokenProvider.expirationSeconds());
    }

    /**
     * Return the authenticated user's profile.
     *
     * @throws AccessDeniedException if no authenticated principal is present.
     */
    public PerfilResponse getPerfil() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || ANONYMOUS.equals(auth.getPrincipal())) {
            throw new AccessDeniedException("No hay una sesion autenticada");
        }
        String correo = (String) auth.getPrincipal();
        var usuario = usuarioService.findByCorreo(correo);
        return new PerfilResponse(usuario.nombre(), usuario.correo());
    }
}
