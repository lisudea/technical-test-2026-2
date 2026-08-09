package co.edu.lab.sistemas.dto;

import co.edu.lab.sistemas.enums.EstadoReserva;

import java.time.LocalDateTime;

// DTO de respuesta para reservas.
public record ReservaResponseDTO(
        Long id,
        EquipoResumenDTO equipo,
        String usuarioNombre,
        String usuarioCorreo,
        LocalDateTime fechaHoraInicio,
        LocalDateTime fechaHoraFin,
        EstadoReserva estadoReserva,
        LocalDateTime fechaCreacion
) {}