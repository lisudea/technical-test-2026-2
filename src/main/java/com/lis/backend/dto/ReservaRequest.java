package com.lis.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record ReservaRequest(
        @NotNull Long equipoId,
        @NotBlank @Size(max = 120) String nombreUsuario,
        @NotBlank @Email @Size(max = 180) String correoUsuario,
        @NotNull @FutureOrPresent LocalDateTime fechaInicio,
        @NotNull @FutureOrPresent LocalDateTime fechaFin
) {}
