package co.edu.lab.sistemas.dto;

// DTO para el ranking histórico de equipos más reservados.
public record TopEquipoDTO(
        Long equipoId,
        String nombre,
        Long totalReservas
) {}