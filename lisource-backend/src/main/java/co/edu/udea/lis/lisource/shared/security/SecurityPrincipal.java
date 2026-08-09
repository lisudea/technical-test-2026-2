package co.edu.udea.lis.lisource.shared.security;

import co.edu.udea.lis.lisource.shared.exception.AppException;
import co.edu.udea.lis.lisource.shared.exception.ErrorCode;
import java.util.Collection;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

public final class SecurityPrincipal {
    private SecurityPrincipal() {}

    public static long userId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof JwtAuthenticationToken token) {
            try {
                return Long.parseLong(token.getToken().getSubject());
            } catch (NumberFormatException ignored) {
                // handled below
            }
        }
        throw new AppException(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_CREDENTIALS,
                "Authentication is required.");
    }

    public static boolean isAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Collection<? extends GrantedAuthority> authorities = authentication == null
                ? java.util.List.of() : authentication.getAuthorities();
        return authorities.stream().anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMINISTRADOR"));
    }

    public static String activeRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof JwtAuthenticationToken token) {
            String activeRole = token.getToken().getClaimAsString("activeRole");
            if (activeRole != null && !activeRole.isBlank()) return activeRole;
        }
        throw new AppException(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_CREDENTIALS,
                "An active role is required.");
    }

    public static Long sessionIdOrNull() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof JwtAuthenticationToken token) {
            Object claim = token.getToken().getClaim("sid");
            if (claim instanceof Number number) return number.longValue();
            if (claim instanceof String value) {
                try {
                    return Long.parseLong(value);
                } catch (NumberFormatException ignored) {
                    // Access tokens issued before session identifiers were added remain usable.
                }
            }
        }
        return null;
    }
}
