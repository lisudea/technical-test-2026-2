package co.edu.lab.sistemas.dto;

import co.edu.lab.sistemas.enums.EstadoReserva;
import java.time.LocalDateTime;

// DTO para la respuesta de la gestión administrativa de reservas.
// Este si contiene el correo del usuario, solo para uso administrativo.
public record ReservaAdminResponseDTO(
        Long id,
        EquipoResumenDTO equipo,
        String usuarioNombre,
        String usuarioCorreo,
        LocalDateTime fechaHoraInicio,
        LocalDateTime fechaHoraFin,
        EstadoReserva estadoReserva,
        LocalDateTime fechaCreacion
) {}