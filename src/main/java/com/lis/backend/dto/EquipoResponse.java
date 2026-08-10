package com.lis.backend.dto;

import com.lis.backend.entity.CategoriaEquipo;
import com.lis.backend.entity.EstadoEquipo;

public record EquipoResponse(
        Long id,
        String codigo,
        String nombre,
        String numeroSerie,
        CategoriaEquipo categoria,
        EstadoEquipo estado,
        String estadoVisual
) {}
