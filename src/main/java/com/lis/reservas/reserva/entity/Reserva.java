package com.lis.reservas.reserva.entity;

import com.lis.reservas.equipo.entity.Equipo;
import com.lis.reservas.usuario.entity.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

/**
 * A time window {@code [fechaHoraInicio, fechaHoraFin)} of an equipo reserved
 * by a usuario.
 *
 * <p>The no-overlap rule is NOT a database constraint (MySQL 8 has no
 * exclusion constraint); it is validated in the service layer inside a
 * transaction using {@code SELECT ... FOR UPDATE} over the equipo's active
 * reservas (see {@code ReservaRepository#findConflictingForUpdate}). Only
 * {@link EstadoReserva#ACTIVA} reservations participate in overlap checks.
 *
 * <p>Reservation windows are stored as {@link OffsetDateTime} to carry an
 * explicit {@code America/Bogota} (UTC-5) offset, matching the spec's
 * ISO-8601 requirement. The underlying column is MySQL {@code DATETIME};
 * Hibernate serializes the offset on write using {@code jdbc.time_zone}.
 */
@Entity
@Table(name = "reservas")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Reserva {

    /** Zone id used to attach an explicit offset when callers omit it. */
    public static final ZoneOffset ZONA = ZoneOffset.ofHours(-5);

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_reserva")
    private Long idReserva;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_equipo", nullable = false,
            foreignKey = @jakarta.persistence.ForeignKey(name = "fk_reservas_equipo"))
    private Equipo equipo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false,
            foreignKey = @jakarta.persistence.ForeignKey(name = "fk_reservas_usuario"))
    private Usuario usuario;

    @Column(name = "fecha_hora_inicio", nullable = false)
    private OffsetDateTime fechaHoraInicio;

    @Column(name = "fecha_hora_fin", nullable = false)
    private OffsetDateTime fechaHoraFin;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 11)
    private EstadoReserva estado;

    @Column(name = "motivo", length = 255)
    private String motivo;

    // --- Loan lifecycle (managed by the auxiliar console) ------------------

    /**
     * Physical hand-over state, orthogonal to {@link #estado}. See
     * {@link EstadoPrestamo} for why these are two columns and not one.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "estado_prestamo", nullable = false, length = 12)
    private EstadoPrestamo estadoPrestamo;

    @Column(name = "fecha_entrega")
    private LocalDateTime fechaEntrega;

    @Column(name = "fecha_devolucion")
    private LocalDateTime fechaDevolucion;

    /** Auxiliar who handed the equipment over. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entregado_por",
            foreignKey = @jakarta.persistence.ForeignKey(name = "fk_reservas_entregado_por"))
    private Usuario entregadoPor;

    /** Auxiliar who took the equipment back. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recibido_por",
            foreignKey = @jakarta.persistence.ForeignKey(name = "fk_reservas_recibido_por"))
    private Usuario recibidoPor;

    @Column(name = "observaciones_prestamo", length = 500)
    private String observacionesPrestamo;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_cancelacion")
    private LocalDateTime fechaCancelacion;

    @PrePersist
    void onCreate() {
        if (this.fechaCreacion == null) {
            this.fechaCreacion = LocalDateTime.now();
        }
        if (this.estado == null) {
            this.estado = EstadoReserva.ACTIVA;
        }
        if (this.estadoPrestamo == null) {
            this.estadoPrestamo = EstadoPrestamo.PENDIENTE;
        }
    }
}
