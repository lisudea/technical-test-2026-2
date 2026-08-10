package com.lis.backend.dto;

public record ResumenResponse(
        long totalEquipos,
        long totalReservas,
        long reservasActivas,
        long disponibles,
        long reservados,
        long mantenimiento
) {}
