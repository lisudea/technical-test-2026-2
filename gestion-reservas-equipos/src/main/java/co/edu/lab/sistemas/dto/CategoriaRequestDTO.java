package co.edu.lab.sistemas.dto;

import jakarta.validation.constraints.NotBlank;

// DTO para la solicitud de creación o actualización de una categoría.
public record CategoriaRequestDTO(
        @NotBlank(message = "El nombre de la categoría es obligatorio")
        String nombre,
        String descripcion
) {}