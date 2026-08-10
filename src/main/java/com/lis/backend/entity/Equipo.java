package com.lis.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "equipos", uniqueConstraints = {
        @UniqueConstraint(name = "uk_equipo_codigo", columnNames = "codigo"),
        @UniqueConstraint(name = "uk_equipo_numero_serie", columnNames = "numero_serie")
})
public class Equipo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ID visible del equipo, por ejemplo EQ-001. */
    @Column(nullable = false, length = 30)
    private String codigo;

    @Column(nullable = false, length = 120)
    private String nombre;

    @Column(name = "numero_serie", nullable = false, length = 120)
    private String numeroSerie;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private CategoriaEquipo categoria;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EstadoEquipo estado;

    public Equipo() {}

    public Long getId() { return id; }
    public String getCodigo() { return codigo; }
    public String getNombre() { return nombre; }
    public String getNumeroSerie() { return numeroSerie; }
    public CategoriaEquipo getCategoria() { return categoria; }
    public EstadoEquipo getEstado() { return estado; }

    public void setId(Long id) { this.id = id; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public void setNumeroSerie(String numeroSerie) { this.numeroSerie = numeroSerie; }
    public void setCategoria(CategoriaEquipo categoria) { this.categoria = categoria; }
    public void setEstado(EstadoEquipo estado) { this.estado = estado; }
}
