package com.lis.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reservas", indexes = {
        @Index(name = "idx_reserva_equipo_fechas", columnList = "equipo_id,fecha_inicio,fecha_fin"),
        @Index(name = "idx_reserva_estado", columnList = "estado")
})
public class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "equipo_id", nullable = false)
    private Equipo equipo;

    @Column(name = "nombre_usuario", nullable = false, length = 120)
    private String nombreUsuario;

    @Column(name = "correo_usuario", nullable = false, length = 180)
    private String correoUsuario;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDateTime fechaInicio;

    @Column(name = "fecha_fin", nullable = false)
    private LocalDateTime fechaFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoReserva estado = EstadoReserva.ACTIVA;

    public Reserva() {}

    public Long getId() { return id; }
    public Equipo getEquipo() { return equipo; }
    public String getNombreUsuario() { return nombreUsuario; }
    public String getCorreoUsuario() { return correoUsuario; }
    public LocalDateTime getFechaInicio() { return fechaInicio; }
    public LocalDateTime getFechaFin() { return fechaFin; }
    public EstadoReserva getEstado() { return estado; }

    public void setId(Long id) { this.id = id; }
    public void setEquipo(Equipo equipo) { this.equipo = equipo; }
    public void setNombreUsuario(String nombreUsuario) { this.nombreUsuario = nombreUsuario; }
    public void setCorreoUsuario(String correoUsuario) { this.correoUsuario = correoUsuario; }
    public void setFechaInicio(LocalDateTime fechaInicio) { this.fechaInicio = fechaInicio; }
    public void setFechaFin(LocalDateTime fechaFin) { this.fechaFin = fechaFin; }
    public void setEstado(EstadoReserva estado) { this.estado = estado; }
}
