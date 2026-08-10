package com.udea.labreservas.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateCategoryDTO(
        @NotBlank(message = "El nombre de la categoria es obligatorio")
        String categoryName
) {
}