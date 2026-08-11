package equipment_api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(Authentication authentication) {

        Object principal = authentication.getPrincipal();

        // Camino Bearer: BearerTokenAuthenticationFilter -> NimbusJwtDecoder
        if (principal instanceof Jwt jwt) {
            return ResponseEntity.ok(Map.of(
                    "email", jwt.getSubject(),
                    "name", jwt.getClaimAsString("name"),
                    "role", jwt.getClaimAsString("role")
            ));
        }

        // Camino sesión OAuth2 (navegador, cookie JSESSIONID)
        if (principal instanceof OAuth2User user) {
            return ResponseEntity.ok(Map.of(
                    "email", user.getAttribute("email"),
                    "name", user.getAttribute("name"),
                    "role", "USER"
            ));
        }

        return ResponseEntity.status(401).build();
    }
}
