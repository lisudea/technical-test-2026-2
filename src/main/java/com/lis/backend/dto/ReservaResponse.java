package com.lis.backend.dto;

import com.lis.backend.entity.EstadoReserva;

import java.time.LocalDateTime;

public record ReservaResponse(
        Long id,
        Long equipoId,
        String equipoNombre,
        String nombreUsuario,
        String correoUsuario,
        LocalDateTime fechaInicio,
        LocalDateTime fechaFin,
        EstadoReserva estado
) {}
