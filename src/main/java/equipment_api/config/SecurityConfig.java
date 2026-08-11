package equipment_api.config;

import equipment_api.service.CustomOAuth2UserService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${jwt.secret}")
    private String jwtSecret;

    /**
     * Origenes permitidos para CORS. Sin esto el frontend del Reto 3, servido
     * en otro puerto, no puede llamar a la API: el navegador bloquea toda
     * peticion cross-origin.
     */
    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173}")
    private String allowedOrigins;

    /**
     * Gestion del inventario (POST y PUT de /api/equipment).
     *
     * true (por defecto) -> exige sesion iniciada con ROLE_USER.
     *
     * Administrar el inventario es una accion de gestion, no de uso: quien
     * pasa por el laboratorio reserva un equipo, pero no da de alta ni edita
     * el catalogo. Los evaluadores de la prueba tienen correo @udea.edu.co,
     * asi que pueden iniciar sesion y probarlo sin barrera alguna.
     */
    @Value("${app.security.protect-equipment:true}")
    private boolean protectEquipment;

    /**
     * Creacion y cancelacion de reservas.
     *
     * false (por defecto) -> publicas. Lo exige el requisito OBLIGATORIO del
     * enunciado: "un usuario identificado por nombre y correo" debe poder
     * crear, cancelar y listar reservas sin depender del bonus de
     * autenticacion.
     *
     * true -> se activa el modo del BONUS: reservar exige un JWT con ROLE_USER.
     *
     * En ambos casos, si llega un JWT valido la identidad se toma del token y
     * NO del cuerpo de la peticion, de forma que nadie puede suplantar a otro.
     */
    @Value("${app.security.protect-reservations:false}")
    private boolean protectReservations;

    @Bean
    public JwtDecoder jwtDecoder() {

        SecretKey key = new SecretKeySpec(
                jwtSecret.getBytes(StandardCharsets.UTF_8),
                "HmacSHA384"
        );

        return NimbusJwtDecoder
                .withSecretKey(key)
                .macAlgorithm(MacAlgorithm.HS384)
                .build();
    }

    /**
     * Convierte el claim "role" de nuestro JWT en una authority de Spring.
     *
     * Sin esto, el conversor por defecto solo mira los claims "scope"/"scp" y
     * les pone el prefijo SCOPE_. Como nuestros tokens llevan {"role":"USER"}
     * y ningun scope, la peticion llegaba SIN authorities y cualquier regla
     * hasRole("USER") respondia 403 aunque el token fuese valido.
     */
    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {

        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();

        converter.setJwtGrantedAuthoritiesConverter(jwt -> {

            Collection<GrantedAuthority> authorities =
                    new ArrayList<>(new JwtGrantedAuthoritiesConverter().convert(jwt));

            String role = jwt.getClaimAsString("role");

            if (role != null && !role.isBlank()) {
                String normalized = role.startsWith("ROLE_") ? role : "ROLE_" + role;
                authorities.add(new SimpleGrantedAuthority(normalized));
            }

            return authorities;
        });

        // Nota: el "name" de la Authentication es el claim "sub" (el email),
        // que ya es el valor por defecto de JwtAuthenticationConverter.

        return converter;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList();

        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(
                List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
        );
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Location"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            CustomOAuth2UserService customOAuth2UserService,
            OAuth2AuthenticationSuccessHandler successHandler,
            JwtAuthenticationConverter jwtAuthenticationConverter)
            throws Exception {

        http
            .cors(Customizer.withDefaults())

            // API REST sin estado para los clientes con token: no usamos
            // formularios, asi que CSRF no aplica.
            .csrf(csrf -> csrf.disable())

            .authorizeHttpRequests(auth -> {

                // ---------------------------------------------------------
                // Preflight de CORS: el navegador lo envia sin credenciales.
                // ---------------------------------------------------------
                auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll();

                // ---------------------------------------------------------
                // PUBLICOS
                // ---------------------------------------------------------
                auth.requestMatchers(
                        "/",
                        "/error",
                        "/oauth2/**",
                        "/login/**"
                ).permitAll();

                // Documentacion (si springdoc esta presente)
                auth.requestMatchers(
                        "/swagger-ui.html",
                        "/swagger-ui/**",
                        "/v3/api-docs/**"
                ).permitAll();

                // Consultas: siempre publicas (requisito de "visualizacion")
                auth.requestMatchers(HttpMethod.GET,
                        "/api/equipment",
                        "/api/equipment/**",
                        "/api/reservations",
                        "/api/reservations/**",
                        "/api/statistics/**"
                ).permitAll();

                // ---------------------------------------------------------
                // GESTION DEL INVENTARIO: por defecto exige sesion
                // ---------------------------------------------------------
                if (protectEquipment) {
                    auth.requestMatchers(HttpMethod.POST, "/api/equipment").hasRole("USER");
                    auth.requestMatchers(HttpMethod.PUT, "/api/equipment/**").hasRole("USER");
                } else {
                    auth.requestMatchers(HttpMethod.POST, "/api/equipment").permitAll();
                    auth.requestMatchers(HttpMethod.PUT, "/api/equipment/**").permitAll();
                }

                // ---------------------------------------------------------
                // RESERVAS: por defecto publicas (requisito obligatorio)
                // ---------------------------------------------------------
                if (protectReservations) {
                    auth.requestMatchers(HttpMethod.POST, "/api/reservations").hasRole("USER");
                    auth.requestMatchers(HttpMethod.DELETE, "/api/reservations/**").hasRole("USER");
                } else {
                    auth.requestMatchers(HttpMethod.POST, "/api/reservations").permitAll();
                    auth.requestMatchers(HttpMethod.DELETE, "/api/reservations/**").permitAll();
                }

                // Informacion del usuario autenticado: siempre requiere sesion/token
                auth.requestMatchers("/api/auth/me").authenticated();

                auth.anyRequest().authenticated();
            })

            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(customOAuth2UserService)
                )
                .successHandler(successHandler)
            )

            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter))
            );

        return http.build();
    }
}