package co.edu.lab.sistemas.dto;

// DTO reducido para exponer solo la informacion esencial de un equipo.
public record EquipoResumenDTO(
        Long id,
        String nombre
) {}