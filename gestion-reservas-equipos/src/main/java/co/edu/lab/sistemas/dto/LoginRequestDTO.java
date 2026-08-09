package co.edu.lab.sistemas.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

// Record para inmutabilidad y encapsulación de los datos de la solicitud de inicio de sesión.
public record LoginRequestDTO(
        @NotBlank @Email String correo,
        @NotBlank String password
) {}

// Este tipo de archivo no requiere setters ni getters ni ningún tipo de lógica de negocio