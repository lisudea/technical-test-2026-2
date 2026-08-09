package co.edu.lab.sistemas.dto;

// DTO para la respuesta de una categoría.
public record CategoriaResponseDTO(
        Long id,
        String nombre,
        String descripcion
) {}