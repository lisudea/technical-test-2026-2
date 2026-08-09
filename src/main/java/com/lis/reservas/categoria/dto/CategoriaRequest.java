package com.lis.reservas.categoria.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body for {@code POST /api/v1/categorias} and
 * {@code PUT /api/v1/categorias/{id}}.
 *
 * @param nombre      category name, unique (required, max 80)
 * @param descripcion optional description (max 255)
 */
public record CategoriaRequest(
        @NotBlank @Size(max = 80) String nombre,
        @Size(max = 255) String descripcion) {
}