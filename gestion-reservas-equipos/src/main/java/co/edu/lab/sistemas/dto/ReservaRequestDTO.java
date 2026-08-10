package co.edu.lab.sistemas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

// DTO para crear reservas de forma pública.
public record ReservaRequestDTO(
        @NotNull(message = "El equipo es obligatorio")
        Long equipoId,

        @NotBlank(message = "El nombre del usuario es obligatorio")
        String usuarioNombre,

        @NotBlank(message = "El ID de token de Google es obligatorio")
        String googleIdToken,

        @NotNull(message = "La fecha y hora de inicio son obligatorias")
        LocalDateTime fechaHoraInicio,

        @NotNull(message = "La fecha y hora de fin son obligatorias")
        LocalDateTime fechaHoraFin
) {}