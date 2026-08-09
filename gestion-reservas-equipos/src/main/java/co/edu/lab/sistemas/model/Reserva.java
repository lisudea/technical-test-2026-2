package co.edu.lab.sistemas.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import co.edu.lab.sistemas.enums.EstadoReserva;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
// Guarda una solicitud de prestamo o uso sin depender de una entidad Usuario.
public class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "equipo_id", nullable = false)
    // La reserva siempre apunta a un equipo existente.
    private Equipo equipo;

    @Column(nullable = false)
    // Nombre de la persona que hizo la reserva, sin crear una cuenta obligatoria.
    private String usuarioNombre;

    @Column(nullable = false)
    // Correo de contacto asociado a la reserva.
    private String usuarioCorreo;

    @Column(nullable = false)
    // Momento desde el que se solicita el uso del equipo.
    private LocalDateTime fechaHoraInicio;

    @Column(nullable = false)
    // Momento en el que termina la reserva.
    private LocalDateTime fechaHoraFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    // Estado actual de la reserva dentro del flujo del sistema.
    private EstadoReserva estadoReserva;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    // Fecha en la que la reserva quedo registrada.
    private LocalDateTime fechaCreacion;
}