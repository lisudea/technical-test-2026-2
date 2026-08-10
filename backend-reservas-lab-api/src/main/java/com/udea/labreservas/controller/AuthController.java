package com.udea.labreservas.controller;

import com.udea.labreservas.dto.AuthResponse;
import com.udea.labreservas.dto.LoginRequest;
import com.udea.labreservas.dto.RegisterUserRequest;
import com.udea.labreservas.dto.UserDTO;
import com.udea.labreservas.security.CurrentUser;
import com.udea.labreservas.service.AuthService;
import com.udea.labreservas.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticacion", description = "Registro, inicio de sesion y perfil de usuarios")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @Operation(summary = "Registrar usuario", description = "Requiere un correo del dominio @udea.edu.co. Devuelve un JWT.")
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @Operation(summary = "Iniciar sesion", description = "Autentica con correo y contrasena. Devuelve un JWT.")
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(@RequestBody String googleToken) {
        AuthResponse authResponse = authService.loginOrRegisterWithGoogle(
                googleToken
        );
        
        return ResponseEntity.ok(authResponse);
    }

    @Operation(summary = "Perfil del usuario autenticado")
    @GetMapping("/me")
    public ResponseEntity<UserDTO> me() {
        return ResponseEntity.ok(userService.getProfile(CurrentUser.getEmail()));
    }
}