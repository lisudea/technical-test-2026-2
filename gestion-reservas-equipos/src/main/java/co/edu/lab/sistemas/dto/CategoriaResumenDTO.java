package co.edu.lab.sistemas.dto;

// DTO reducido para exponer solo la informacion esencial de una categoria.
public record CategoriaResumenDTO(
        Long id,
        String nombre
) {}