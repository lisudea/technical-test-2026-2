package co.edu.lab.sistemas.dto;

// DTO para la respuesta de inicio de sesión, incluyendo el token JWT y la información del usuario.
public record LoginResponseDTO(
        String token,
        String correo,
        String rol
) {}