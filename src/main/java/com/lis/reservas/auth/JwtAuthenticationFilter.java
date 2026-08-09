package com.lis.reservas.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Statelesss JWT authentication filter.
 *
 * <p>Runs once per request, extracts a {@code Authorization: Bearer <token>}
 * header and, when the token is valid, populates the
 * {@link SecurityContextHolder} with a {@link UsernamePasswordAuthenticationToken}
 * whose principal is the user's {@code correo}. On missing or invalid tokens
 * the filter silently does nothing — the downstream authorization rules
 * (configured in {@code SecurityConfig}) decide whether to return 401; the
 * filter never raises, so public endpoints keep working.
 *
 * <p>Registered as a {@code @Bean} inside {@code SecurityConfig} (rather than
 * a {@code @Component}) so that {@code @WebMvcTest} slices, which exclude the
 * security configuration, never try to instantiate it without its
 * {@link JwtTokenProvider} dependency.
 */
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = extractToken(request);
        if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
            String correo = jwtTokenProvider.getCorreoFromToken(token);
            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(correo, null, List.of());
            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith(BEARER_PREFIX)) {
            return header.substring(BEARER_PREFIX.length());
        }
        return null;
    }
}
