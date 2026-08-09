package com.example.lis_equipment_system.auth.security;

import com.example.lis_equipment_system.auth.service.JwtService;
import com.example.lis_equipment_system.user.entity.User;
import com.example.lis_equipment_system.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2Handler implements AuthenticationSuccessHandler {
    private final UserService userService;
    private final JwtService jwtService;

    @Value("${frontend.url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                         Authentication authentication) throws IOException {
        OidcUser oidcUser = (OidcUser) authentication.getPrincipal();
        String email = oidcUser.getEmail();
        String name = oidcUser.getFullName();

        User user = userService.findOrCreateByEmail(email, name);
        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());

        String redirectUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/auth/callback")
                .queryParam("token", token)
                .queryParam("email", user.getEmail())
                .queryParam("role", user.getRole().name())
                .build().toUriString();

        response.sendRedirect(redirectUrl);
    }
    
}