package equipment_api.service;

import equipment_api.entity.User;
import equipment_api.repository.UserRepository;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

/**
 * Valida que el correo de Google pertenezca al dominio institucional y
 * registra al usuario en la base de datos.
 *
 * El alta del usuario es imprescindible: las reservas apuntan a la tabla
 * `users` mediante una FK, asi que si el login no persistiese al usuario,
 * crear una reserva fallaria siempre con 404 "usuario no encontrado".
 */
@Service
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private static final String INSTITUTIONAL_DOMAIN = "@udea.edu.co";

    private final DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();

    private final UserRepository userRepository;

    public CustomOAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest)
            throws OAuth2AuthenticationException {

        OAuth2User user = delegate.loadUser(userRequest);

        String email = user.getAttribute("email");

        if (email == null || !email.toLowerCase().endsWith(INSTITUTIONAL_DOMAIN)) {

            OAuth2Error error = new OAuth2Error(
                    "invalid_institutional_email",
                    "Solo se permiten cuentas " + INSTITUTIONAL_DOMAIN,
                    null
            );

            throw new OAuth2AuthenticationException(error);
        }

        String name = user.getAttribute("name");

        registerOrUpdate(email, name != null ? name : email);

        return new DefaultOAuth2User(
                Collections.singleton(
                        new SimpleGrantedAuthority("ROLE_USER")
                ),
                user.getAttributes(),
                "email"
        );
    }

    /**
     * Alta idempotente: si el usuario ya existe se actualiza su nombre por si
     * cambio en Google; si no, se crea.
     */
    private void registerOrUpdate(String email, String name) {

        User entity = userRepository.findByEmail(email)
                .orElseGet(() -> new User(name, email));

        entity.setName(name);

        userRepository.save(entity);
    }
}