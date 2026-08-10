package com.lis.backend.dto;

public record CategoriaStatsResponse(
        String categoria,
        long total,
        long disponibles
) {}
