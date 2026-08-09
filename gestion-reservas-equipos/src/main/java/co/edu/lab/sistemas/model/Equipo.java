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
import org.hibernate.annotations.UpdateTimestamp;

import co.edu.lab.sistemas.enums.EstadoFisico;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
// Representa un equipo de laboratorio y conserva su estado fisico e historial de cambios.
public class Equipo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false, unique = true)
    // Identificador unico del equipo, como numero de serie o MAC.
    private String identificador;

    @ManyToOne(optional = false)
    @JoinColumn(name = "idCategoria", nullable = false)
    // Cada equipo pertenece a una sola categoria.
    private Categoria categoria;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    // Solo describe la condicion fisica del equipo; su disponibilidad operativa se calcula aparte.
    private EstadoFisico estadoFisico;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    // Se llena automaticamente cuando el registro se crea.
    private LocalDateTime fechaRegistro;

    @UpdateTimestamp
    @Column(nullable = false)
    // Se actualiza automaticamente cada vez que el equipo cambia.
    private LocalDateTime fechaActualizacion;
}