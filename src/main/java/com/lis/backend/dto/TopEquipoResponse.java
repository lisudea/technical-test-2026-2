package com.lis.backend.dto;

public record TopEquipoResponse(
        int posicion,
        Long equipoId,
        String nombre,
        String categoria,
        long cantidadReservas
) {}
