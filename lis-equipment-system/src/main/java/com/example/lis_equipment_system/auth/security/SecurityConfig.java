package com.example.lis_equipment_system.auth.security;

import com.example.lis_equipment_system.auth.service.OidcService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final OidcService customOidcUserService;
    private final OAuth2Handler oAuth2Handler;
    private final JwtAuthenticationConverter jwtAuthenticationConverter;

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/").permitAll()
                .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/equipment/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/equipment/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/v1/equipment/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/v1/reservation/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/reservation/**").authenticated()
                .requestMatchers(HttpMethod.PATCH, "/api/v1/reservation/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/v1/stats/**").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo.oidcUserService(customOidcUserService))
                .successHandler(oAuth2Handler)
                .failureUrl("/?error=dominio_no_permitido")
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter))
            )
            .build();
    }
}