package com.lis.backend.entity;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Estado actual del equipo")
public enum EstadoEquipo {
    @Schema(description = "El equipo puede ser reservado")
    DISPONIBLE,

    @Schema(description = "El equipo está reservado en este momento por una reserva activa")
    RESERVADO,

    @Schema(description = "El equipo no puede reservarse mientras esté en mantenimiento")
    EN_MANTENIMIENTO
}
