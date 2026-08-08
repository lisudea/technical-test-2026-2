package com.lis.reservas.common.entity;

import com.lis.reservas.usuario.entity.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

/**
 * Lightweight audit log: who created/cancelled what and when. Useful to
 * explain history during the demo and as a base for metrics. Optional but
 * recommended by the spec.
 */
@Entity
@Table(name = "log_actividad")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LogActividad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_log")
    private Long idLog;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario",
            foreignKey = @jakarta.persistence.ForeignKey(name = "fk_log_usuario"))
    private Usuario usuario;

    @Column(name = "accion", nullable = false, length = 80)
    private String accion;

    @Column(name = "tabla_afectada", length = 80)
    private String tablaAfectada;

    @Column(name = "id_registro_afectado")
    private Long idRegistroAfectado;

    @Column(name = "detalle", columnDefinition = "JSON")
    private String detalle;

    @Column(name = "fecha_hora", nullable = false, updatable = false)
    private LocalDateTime fechaHora;

    @Column(name = "ip_origen", length = 45)
    private String ipOrigen;

    @PrePersist
    void onCreate() {
        if (this.fechaHora == null) {
            this.fechaHora = LocalDateTime.now();
        }
    }
}
