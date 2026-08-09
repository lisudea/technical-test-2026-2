package udea.lis.equipos_reservas_api.dto;

// Se importan las anotaciones de validación de Jakarta Bean Validation para asegurar que los datos recibidos en la solicitud
// cumplan con ciertos criterios antes de ser procesados.
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class ReservaRequest {

    // Se definen los atributos de la clase ReservaRequest, que representan los datos necesarios para crear una reserva.
    @NotBlank(message = "El nombre del usuario es obligatorio")
    private String nombreUsuario;

    @NotBlank(message = "El correo del usuario es obligatorio")
    @Email(message = "El correo del usuario no tiene un formato válido")
    private String correoUsuario;

    @NotNull(message = "El id del equipo es obligatorio")
    private Long equipoId;

    @NotNull(message = "La fecha de inicio de la reserva es obligatoria")
    private LocalDateTime fechaReserva;

    @NotNull(message = "La fecha de devolución de la reserva es obligatoria")
    private LocalDateTime fechaDevolucion;

    public ReservaRequest() {
    }

    public ReservaRequest(String nombreUsuario, String correoUsuario, Long equipoId,
                          LocalDateTime fechaReserva, LocalDateTime fechaDevolucion) {
        this.nombreUsuario = nombreUsuario;
        this.correoUsuario = correoUsuario;
        this.equipoId = equipoId;
        this.fechaReserva = fechaReserva;
        this.fechaDevolucion = fechaDevolucion;
    }

    public String getNombreUsuario() {
        return nombreUsuario;
    }

    public void setNombreUsuario(String nombreUsuario) {
        this.nombreUsuario = nombreUsuario;
    }

    public String getCorreoUsuario() {
        return correoUsuario;
    }

    public void setCorreoUsuario(String correoUsuario) {
        this.correoUsuario = correoUsuario;
    }

    public Long getEquipoId() {
        return equipoId;
    }

    public void setEquipoId(Long equipoId) {
        this.equipoId = equipoId;
    }

    public LocalDateTime getFechaReserva() {
        return fechaReserva;
    }

    public void setFechaReserva(LocalDateTime fechaReserva) {
        this.fechaReserva = fechaReserva;
    }

    public LocalDateTime getFechaDevolucion() {
        return fechaDevolucion;
    }

    public void setFechaDevolucion(LocalDateTime fechaDevolucion) {
        this.fechaDevolucion = fechaDevolucion;
    }
}
