package com.udea.labreservas.service;

import com.google.api.client.json.GenericJson;
import com.google.api.client.json.webtoken.JsonWebSignature;
import com.google.auth.oauth2.TokenVerifier;

import com.udea.labreservas.dto.AuthResponse;
import com.udea.labreservas.dto.LoginRequest;
import com.udea.labreservas.dto.RegisterUserRequest;
import com.udea.labreservas.dto.UserDTO;
import com.udea.labreservas.entity.Role;
import com.udea.labreservas.entity.User;
import com.udea.labreservas.exception.AlreadyExistsException;
import com.udea.labreservas.exception.EmailDomainNotAllowedException;
import com.udea.labreservas.exception.InvalidCredentialsException;
import com.udea.labreservas.exception.InvalidGoogleTokenException;
import com.udea.labreservas.exception.ResourceNotFoundException;
import com.udea.labreservas.mapping.UserMapper;
import com.udea.labreservas.repository.UserRepository;
import com.udea.labreservas.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuthService {

    public static final String INSTITUTIONAL_DOMAIN = "@udea.edu.co";
    private static final String GOOGLE_ISSUER = "https://accounts.google.com";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserMapper userMapper;
    private final TokenVerifier googleIdTokenVerifier;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       UserMapper userMapper,
                       @Value("${spring.security.oauth2.client.registration.google.client-id}") String googleClientId) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userMapper = userMapper;
        this.googleIdTokenVerifier = TokenVerifier.newBuilder()
                .setAudience(googleClientId)
                .setIssuer(GOOGLE_ISSUER)
                .build();
        System.out.println("---[ CLIENT ID INYECTADO EN BACKEND ]---");
        System.out.println("Valor: '" + googleClientId + "'");
        System.out.println("----------------------------------------");
    }

    @Transactional
    public AuthResponse register(RegisterUserRequest request) {
        String email = normalizeEmail(request.email());
        validateInstitutionalDomain(email);

        if (userRepository.existsByEmail(email)) {
            throw new AlreadyExistsException("Ya existe un usuario registrado con el correo " + email);
        }

        User user = new User();
        user.setName(request.name().trim());
        user.setLastName(request.lastName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(Role.USUARIO);

        User saved = userRepository.save(user);
        String token = jwtService.generateToken(saved);
        return new AuthResponse(token, userMapper.toDto(saved));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException("Correo o contrasena incorrectos"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new InvalidCredentialsException("Correo o contrasena incorrectos");
        }

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, userMapper.toDto(user));
    }

    /**
     * Valida el ID token de Google enviado por el frontend (firma, emisor y audiencia) y, si el
     * correo pertenece al dominio @udea.edu.co, emite el JWT de la aplicacion.
     */
    public AuthResponse loginOrRegisterWithGoogle(String idTokenString) {
        if (idTokenString == null || idTokenString.isBlank()) {
            throw new InvalidGoogleTokenException("El idToken de Google es obligatorio");
        }

        JsonWebSignature verifiedToken;
        try {
            verifiedToken = googleIdTokenVerifier.verify(idTokenString);
        } catch (TokenVerifier.VerificationException e) {
            throw new InvalidGoogleTokenException(
                    "El token de Google no es valido, expiro o no pertenece a esta aplicacion: "
                            + e.getMessage());
        }

        GenericJson payload = verifiedToken.getPayload();
        String email = (String) payload.get("email");
        String name = (String) payload.get("name");
        String givenName = (String) payload.get("given_name");
        String familyName = (String) payload.get("family_name");

        if (email == null || email.isBlank()) {
            throw new InvalidGoogleTokenException(
                    "El token de Google no contiene un correo; revise los scopes solicitados");
        }

        return loginOrRegisterWithGoogle(email, name, givenName, familyName);
    }

    @Transactional
    public AuthResponse loginOrRegisterWithGoogle(String email, String fullName,
                                                  String givenName, String familyName) {
        if (email == null || email.isBlank()) {
            throw new EmailDomainNotAllowedException(
                    "La cuenta de Google no expuso un correo. Verifica la configuracion OAuth");
        }
        validateInstitutionalDomain(email);

        User user = userRepository.findByEmail(normalizeEmail(email)).orElseGet(() -> {
            User newUser = new User();
            newUser.setName(givenName != null && !givenName.isBlank()
                    ? givenName.trim() : firstNameOf(fullName));
            newUser.setLastName(familyName != null && !familyName.isBlank()
                    ? familyName.trim() : lastNameOf(fullName));
            newUser.setEmail(normalizeEmail(email));
            newUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            newUser.setRole(Role.USUARIO);
            return userRepository.save(newUser);
        });

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, userMapper.toDto(user));
    }

    @Transactional(readOnly = true)
    public UserDTO getProfile(String email) {
        User user = userRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        return userMapper.toDto(user);
    }

    public void validateInstitutionalDomain(String email) {
        String normalized = normalizeEmail(email);
        if (!normalized.endsWith(INSTITUTIONAL_DOMAIN)) {
            throw new EmailDomainNotAllowedException(
                    "El correo debe pertenecer unicamente al dominio institucional " + INSTITUTIONAL_DOMAIN);
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private String firstNameOf(String fullName) {
        return fullName == null ? "" : fullName.trim().split("\\s+")[0];
    }

    private String lastNameOf(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return "";
        }
        String[] parts = fullName.trim().split("\\s+");
        return parts.length > 1 ? parts[parts.length - 1] : "";
    }
}