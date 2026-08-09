package com.example.lis_equipment_system.auth.security;

import com.example.lis_equipment_system.auth.service.OidcService;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final OidcService oidcService;
    private final OAuth2Handler oAuth2Handler;
    private final JwtAuthenticationConverter jwtAuthenticationConverter;
    private final CorsConfigurationSource corsConfigurationSource;

    @Value("${frontend.url}")
    private String frontendUrl;

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/equipment/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/equipment/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/v1/equipment/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/v1/reservation/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/reservation/**").authenticated()
                .requestMatchers(HttpMethod.PATCH, "/api/v1/reservation/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/v1/stats/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/logout").authenticated()
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo.oidcUserService(oidcService))
                .successHandler(oAuth2Handler)
                .failureUrl(frontendUrl + "/login?error=dominio_no_permitido")
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter))
            )
            .build();
    }
}