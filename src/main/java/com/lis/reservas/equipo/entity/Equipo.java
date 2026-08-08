package com.lis.reservas.equipo.entity;

import com.lis.reservas.categoria.entity.Categoria;
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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * A physical piece of equipment managed by the laboratory. A equipo has a
 * global {@link EstadoEquipo}; punctual occupancy during a window is derived
 * from active reservations, not persisted on the equipo.
 *
 * <p>{@code fechaCreacion} / {@code fechaActualizacion} mirror the MySQL
 * {@code DEFAULT CURRENT_TIMESTAMP} / {@code ON UPDATE CURRENT_TIMESTAMP}
 * columns. They are populated here via {@link PrePersist}/{@link PreUpdate}
 * so the in-memory entity stays consistent with what the DB writes, and so
 * unit tests (no DB round-trip) still observe correct timestamps.
 */
@Entity
@Table(name = "equipos")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Equipo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_equipo")
    private Integer idEquipo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_categoria", nullable = false,
            foreignKey = @jakarta.persistence.ForeignKey(name = "fk_equipos_categoria"))
    private Categoria categoria;

    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    @Column(name = "numero_serie", unique = true, length = 100)
    private String numeroSerie;

    @Column(name = "mac_address", length = 17)
    private String macAddress;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 13)
    private EstadoEquipo estado;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion", nullable = false)
    private LocalDateTime fechaActualizacion;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.fechaCreacion = now;
        this.fechaActualizacion = now;
        if (this.estado == null) {
            this.estado = EstadoEquipo.DISPONIBLE;
        }
    }

    @PreUpdate
    void onUpdate() {
        this.fechaActualizacion = LocalDateTime.now();
    }
}
