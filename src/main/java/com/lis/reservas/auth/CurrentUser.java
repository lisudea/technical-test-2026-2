package com.lis.reservas.auth;

import com.lis.reservas.usuario.entity.Rol;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Read access to the authenticated principal, so services do not each
 * re-implement the same {@link SecurityContextHolder} dance.
 *
 * <p>The principal is the user's {@code correo} and the single authority is
 * {@code ROLE_<rol>}, both populated by {@link JwtAuthenticationFilter} from
 * the signed token. Everything here derives from that token — never from
 * request parameters or bodies, which the client controls.
 *
 * <p>{@link #correo()} and {@link #rol()} are the strict accessors: they
 * raise {@link AccessDeniedException} when there is no authenticated user,
 * which the RFC 7807 advice turns into a 403. Use {@link #correoOptional()}
 * on the paths that legitimately serve anonymous callers.
 */
@Component
public class CurrentUser {

    private static final String ANONYMOUS = "anonymousUser";
    private static final String ROLE_PREFIX = "ROLE_";

    /**
     * @throws AccessDeniedException when no authenticated user is present.
     */
    public String correo() {
        return correoOptional().orElseThrow(
                () -> new AccessDeniedException("No hay una sesion autenticada"));
    }

    /**
     * Authenticated user's role, derived from the token's authority.
     *
     * @throws AccessDeniedException when no authenticated user is present.
     */
    public Rol rol() {
        Authentication auth = authentication()
                .orElseThrow(() -> new AccessDeniedException("No hay una sesion autenticada"));
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith(ROLE_PREFIX))
                .map(a -> Rol.parseOr(a.substring(ROLE_PREFIX.length()), Rol.ESTUDIANTE))
                .findFirst()
                .orElse(Rol.ESTUDIANTE);
    }

    /** The authenticated correo, or empty for anonymous callers. */
    public Optional<String> correoOptional() {
        return authentication().map(auth -> (String) auth.getPrincipal());
    }

    /** True when the caller is an AUXILIAR or an ADMIN (loan-desk staff). */
    public boolean esPersonal() {
        return correoOptional().isPresent() && rol().atLeast(Rol.AUXILIAR);
    }

    /** True when the caller is an ADMIN. */
    public boolean esAdmin() {
        return correoOptional().isPresent() && rol() == Rol.ADMIN;
    }

    private Optional<Authentication> authentication() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()
                || ANONYMOUS.equals(auth.getPrincipal())
                || !(auth.getPrincipal() instanceof String)) {
            return Optional.empty();
        }
        return Optional.of(auth);
    }
}
