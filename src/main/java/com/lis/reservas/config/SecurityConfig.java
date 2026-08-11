package com.lis.reservas.config;

import com.lis.reservas.auth.JwtAuthenticationFilter;
import com.lis.reservas.auth.JwtTokenProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Stateless Spring Security configuration for the Reservas LIS API.
 *
 * <p>CSRF is disabled (the API is stateless and token-based); sessions are
 * STATELESS. The authorization rules keep the public read surface open
 * (GET /equipos, /categorias, /estadisticas, POST /auth/google, Swagger)
 * while every other endpoint requires a valid JWT, and the privileged
 * surfaces additionally require a role:
 *
 * <table border="1">
 *   <caption>Role matrix</caption>
 *   <tr><th>Surface</th><th>ESTUDIANTE</th><th>AUXILIAR</th><th>ADMIN</th></tr>
 *   <tr><td>Catalog read, statistics</td><td>public</td><td>public</td><td>public</td></tr>
 *   <tr><td>Own reservations (create/list/cancel)</td><td>yes</td><td>yes</td><td>yes</td></tr>
 *   <tr><td>Loan desk /prestamos</td><td>—</td><td>yes</td><td>yes</td></tr>
 *   <tr><td>Equipment estado patch</td><td>—</td><td>yes</td><td>yes</td></tr>
 *   <tr><td>Equipment CRUD, categories</td><td>—</td><td>—</td><td>yes</td></tr>
 *   <tr><td>Sanctions (write)</td><td>—</td><td>—</td><td>yes</td></tr>
 *   <tr><td>Sanctions (read)</td><td>own only</td><td>yes</td><td>yes</td></tr>
 *   <tr><td>/admin (users, roles, summary)</td><td>—</td><td>—</td><td>yes</td></tr>
 * </table>
 *
 * <p>Ordering matters: {@code requestMatchers} is evaluated top-down and the
 * first match wins, so the narrow {@code /sanciones/mias} rule must precede
 * the broad {@code /sanciones/**} one. Rules that cannot be expressed as a
 * path pattern — "an ESTUDIANTE only sees their own reservations" — live in
 * the service layer, which is the only place that can compare the principal
 * against row ownership. The
 * {@link JwtAuthenticationFilter} runs before
 * {@link UsernamePasswordAuthenticationFilter} to populate the
 * {@link org.springframework.security.core.context.SecurityContextHolder}
 * from the Bearer token. Missing authentication is answered with an RFC 7807
 * 401 Problem Detail via the custom {@link AuthenticationEntryPoint}.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    // Role NAMES (no ROLE_ prefix): hasRole()/hasAnyRole() add it themselves.
    private static final String ADMIN = "ADMIN";
    private static final String AUXILIAR = "AUXILIAR";

    private final JwtTokenProvider jwtTokenProvider;

    public SecurityConfig(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Bean
    JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter(jwtTokenProvider);
    }

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter)
            throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // --- Public read surface -------------------------------------
                .requestMatchers(HttpMethod.GET, "/api/v1/equipos/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/categorias/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/estadisticas/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/google").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()

                // --- Admin console: catalog and people -----------------------
                .requestMatchers("/api/v1/admin/**").hasRole(ADMIN)
                .requestMatchers(HttpMethod.POST,   "/api/v1/equipos").hasRole(ADMIN)
                .requestMatchers(HttpMethod.PUT,    "/api/v1/equipos/**").hasRole(ADMIN)
                .requestMatchers(HttpMethod.DELETE, "/api/v1/equipos/**").hasRole(ADMIN)
                .requestMatchers(HttpMethod.POST,   "/api/v1/categorias/**").hasRole(ADMIN)
                // An auxiliar sends equipment to maintenance from the loan desk,
                // so the narrow estado patch is staff-wide, unlike full CRUD.
                .requestMatchers(HttpMethod.PATCH,  "/api/v1/equipos/*/estado")
                    .hasAnyRole(ADMIN, AUXILIAR)

                // --- Sanctions: staff read, admin write ----------------------
                .requestMatchers(HttpMethod.GET,   "/api/v1/sanciones/mias").authenticated()
                .requestMatchers(HttpMethod.GET,   "/api/v1/sanciones/**").hasAnyRole(ADMIN, AUXILIAR)
                .requestMatchers("/api/v1/sanciones/**").hasRole(ADMIN)

                // --- Loan desk: auxiliar and admin ---------------------------
                .requestMatchers("/api/v1/prestamos/**").hasAnyRole(ADMIN, AUXILIAR)

                .anyRequest().authenticated())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling(eh -> eh.authenticationEntryPoint(problemDetailEntryPoint()));
        return http.build();
    }

    @Bean
    AuthenticationEntryPoint problemDetailEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
            response.getWriter().write(
                    "{\"type\":\"https://lis.udea.edu.co/errors/no-autenticado\","
                            + "\"title\":\"No autenticado\",\"status\":401,"
                            + "\"detail\":\"Se requiere autenticacion para acceder\"}");
        };
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(java.util.List.of("*"));
        config.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(java.util.List.of("Authorization", "Content-Type", "X-Requested-With"));
        config.setExposedHeaders(java.util.List.of("Authorization"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
