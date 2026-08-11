package equipment_api.config;

// Spring Boot 4 usa Jackson 3, cuyo paquete es `tools.jackson` (en Jackson 2
// era `com.fasterxml.jackson`). El ObjectMapper lo aporta el contexto de Spring.
import tools.jackson.databind.ObjectMapper;

import equipment_api.service.JwtService;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Se ejecuta cuando el login con Google termina bien.
 *
 * Tiene dos comportamientos segun quien pregunte:
 *
 *  - Navegador (flujo normal del SPA): redirige al frontend con el token en la
 *    query string, para que la aplicacion React pueda recogerlo. Antes se
 *    escribia el JSON directamente en la respuesta, lo que dejaba al usuario
 *    mirando un `{"token": "..."}` en pantalla sin forma de continuar.
 *
 *  - Cliente que pide JSON explicitamente (Postman/curl con
 *    `Accept: application/json`): devuelve {"token": "..."} para poder copiar
 *    el token durante las pruebas.
 */
@Component
public class OAuth2AuthenticationSuccessHandler
        implements AuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final ObjectMapper objectMapper;
    private final String redirectUri;

    public OAuth2AuthenticationSuccessHandler(
            JwtService jwtService,
            ObjectMapper objectMapper,
            @Value("${app.frontend.redirect-uri:http://localhost:5173/auth/callback}") String redirectUri) {

        this.jwtService = jwtService;
        this.objectMapper = objectMapper;
        this.redirectUri = redirectUri;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication)
            throws IOException, ServletException {

        OAuth2User user = (OAuth2User) authentication.getPrincipal();

        String token = jwtService.generateToken(user);

        if (wantsJson(request)) {

            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());

            objectMapper.writeValue(
                    response.getWriter(),
                    Map.of(
                            "token", token,
                            "email", String.valueOf(user.getAttribute("email")),
                            "name", String.valueOf(user.getAttribute("name"))
                    )
            );

            return;
        }

        String target = UriComponentsBuilder
                .fromUriString(redirectUri)
                .queryParam("token", token)
                .build()
                .toUriString();

        response.sendRedirect(target);
    }

    private boolean wantsJson(HttpServletRequest request) {

        String accept = request.getHeader("Accept");

        // Los navegadores mandan "text/html,..." al navegar; Postman y curl
        // pueden pedir explicitamente JSON.
        return accept != null
                && accept.contains(MediaType.APPLICATION_JSON_VALUE)
                && !accept.contains(MediaType.TEXT_HTML_VALUE);
    }
}