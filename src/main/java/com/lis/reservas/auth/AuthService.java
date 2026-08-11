package com.lis.reservas.auth;

import com.lis.reservas.auth.dto.GoogleAuthRequest;
import com.lis.reservas.auth.dto.PerfilResponse;
import com.lis.reservas.auth.dto.TokenResponse;
import com.lis.reservas.usuario.entity.Usuario;
import com.lis.reservas.usuario.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

/**
 * Orchestrates the Google SSO exchange and the authenticated profile lookup.
 *
 * <p>{@link #authenticate} validates the Google id_token via
 * {@link GoogleTokenValidator} (enforcing the {@code @udea.edu.co} domain),
 * upserts the {@code usuarios} row by {@code correo} and issues a signed JWT
 * through {@link JwtTokenProvider}. {@link #getPerfil} reads the correo from
 * {@link CurrentUser} (populated by the JWT filter) and returns the stored
 * profile.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String BEARER = "Bearer";

    private final GoogleTokenValidator googleTokenValidator;
    private final UsuarioService usuarioService;
    private final JwtTokenProvider jwtTokenProvider;
    private final CurrentUser currentUser;

    /**
     * Exchange a Google id_token for a signed JWT.
     *
     * <p>The role baked into the token is the one the upsert resolved (stored
     * role, possibly raised by the configured bootstrap) — never anything the
     * client sent. A role change therefore takes effect on the user's next
     * sign-in, which is the trade-off of stateless tokens with no revocation
     * list; the 30-minute expiry bounds the staleness.
     */
    public TokenResponse authenticate(GoogleAuthRequest request) {
        GoogleTokenValidator.GoogleUserInfo info =
                googleTokenValidator.verify(request.idToken());
        Usuario usuario = usuarioService.upsertByCorreo(info.email(), info.nombre());
        String token = jwtTokenProvider.generateToken(
                usuario.getCorreo(), usuario.getNombre(), usuario.getRol());
        return new TokenResponse(token, BEARER, jwtTokenProvider.expirationSeconds());
    }

    /**
     * Return the authenticated user's profile, including the role currently
     * stored in the database (which may already be ahead of the token's
     * claim if an ADMIN just changed it).
     *
     * @throws AccessDeniedException if no authenticated principal is present.
     */
    public PerfilResponse getPerfil() {
        var usuario = usuarioService.findByCorreo(currentUser.correo());
        return new PerfilResponse(usuario.nombre(), usuario.correo(), usuario.rol());
    }
}
