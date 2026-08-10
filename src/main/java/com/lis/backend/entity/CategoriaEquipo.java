package com.lis.backend.entity;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Categoría a la que pertenece el equipo")
public enum CategoriaEquipo {
    MICROCONTROLADORES,
    REALIDAD_VIRTUAL,
    REDES,
    COMPUTADORES,
    IMPRESORAS_3D,
    SENSORES
}
