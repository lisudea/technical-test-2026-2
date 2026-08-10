package co.edu.lab.sistemas.service;

import co.edu.lab.sistemas.dto.GoogleLoginRequestDTO;
import co.edu.lab.sistemas.dto.LoginRequestDTO;
import co.edu.lab.sistemas.dto.LoginResponseDTO;
import co.edu.lab.sistemas.model.Usuario;
import co.edu.lab.sistemas.repository.UsuarioRepository;
import co.edu.lab.sistemas.security.GoogleTokenVerifierService;
import co.edu.lab.sistemas.security.JwtUtil;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    // Atributo para verificar tokens de Google
    private final GoogleTokenVerifierService googleTokenVerifierService;
    
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    private static final String CREDENCIALES_INVALIDAS = "Credenciales inválidas";

    // Métodos

    public LoginResponseDTO login(LoginRequestDTO request) {
        Usuario usuario = usuarioRepository.findByCorreo(request.correo())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, CREDENCIALES_INVALIDAS));

        if (!passwordEncoder.matches(request.password(), usuario.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, CREDENCIALES_INVALIDAS);
        }

        String token = jwtUtil.generateToken(usuario.getCorreo(), usuario.getRol());
        return new LoginResponseDTO(token, usuario.getCorreo(), usuario.getRol().name());
    }

    // Método para manejar el inicio de sesión con Google
    public LoginResponseDTO loginConGoogle(GoogleLoginRequestDTO request) {
        String correo = googleTokenVerifierService.verificarYExtraerCorreo(request.idToken());

        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "usuario no autorizado en el sistema"));

        String token = jwtUtil.generateToken(usuario.getCorreo(), usuario.getRol());
        return new LoginResponseDTO(token, usuario.getCorreo(), usuario.getRol().name());
    }
}