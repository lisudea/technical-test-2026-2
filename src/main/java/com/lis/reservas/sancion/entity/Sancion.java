package com.lis.reservas.sancion.entity;

import com.lis.reservas.reserva.entity.Reserva;
import com.lis.reservas.usuario.entity.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
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

/**
 * A time-boxed bar on a user's ability to create reservations.
 *
 * <p>Being sanctioned is modelled as a row with a validity window rather
 * than a flag on {@code usuarios}, because the lab needs the history: who
 * was sanctioned, why, by whom, whether it was lifted early and by whom. A
 * boolean carries none of that.
 *
 * <p>"In force right now" is consequently a derived question — see
 * {@link #estaVigente()} and the repository's
 * {@code existsVigenteByUsuario} query. An {@link EstadoSancion#ACTIVA}
 * sanction whose {@code fechaFin} has passed simply stops matching; nothing
 * has to run on a schedule to expire it.
 */
@Entity
@Table(name = "sanciones")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Sancion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_sancion")
    private Long idSancion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false,
            foreignKey = @ForeignKey(name = "fk_sanciones_usuario"))
    private Usuario usuario;

    @Column(name = "motivo", nullable = false, length = 255)
    private String motivo;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDateTime fechaInicio;

    @Column(name = "fecha_fin", nullable = false)
    private LocalDateTime fechaFin;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 9)
    private EstadoSancion estado;

    @Enumerated(EnumType.STRING)
    @Column(name = "origen", nullable = false, length = 11)
    private OrigenSancion origen;

    /** The unclaimed reservation that triggered an AUTOMATICA sanction. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_reserva",
            foreignKey = @ForeignKey(name = "fk_sanciones_reserva"))
    private Reserva reserva;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creada_por",
            foreignKey = @ForeignKey(name = "fk_sanciones_creada_por"))
    private Usuario creadaPor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "levantada_por",
            foreignKey = @ForeignKey(name = "fk_sanciones_levantada_por"))
    private Usuario levantadaPor;

    @Column(name = "fecha_levantamiento")
    private LocalDateTime fechaLevantamiento;

    @Column(name = "observacion_levantamiento", length = 255)
    private String observacionLevantamiento;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    /** True when this sanction stands AND its window has not elapsed. */
    public boolean estaVigente() {
        return estado == EstadoSancion.ACTIVA
                && fechaFin != null
                && fechaFin.isAfter(LocalDateTime.now());
    }

    @PrePersist
    void onCreate() {
        if (this.fechaCreacion == null) {
            this.fechaCreacion = LocalDateTime.now();
        }
        if (this.estado == null) {
            this.estado = EstadoSancion.ACTIVA;
        }
        if (this.origen == null) {
            this.origen = OrigenSancion.MANUAL;
        }
    }
}
