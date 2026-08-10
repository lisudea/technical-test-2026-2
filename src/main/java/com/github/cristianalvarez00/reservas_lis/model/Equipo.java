package com.github.cristianalvarez00.reservas_lis.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import com.github.cristianalvarez00.reservas_lis.enums.*;


/*
ENTIDAD EQUIPO:
Representa la tabla equipos dentro de la base de datos.
El numero de serie se deja como unico para evitar registrar el mismo equipo dos veces.
*/
@Data
@Entity
@Table(name = "equipos")

public class Equipo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @NotBlank(message = "Campo obligatorio")
    @Column(nullable = false)
    private String nombre;

    @NotBlank(message = "Campo obligatorio")
    @Column(nullable = false, unique = true)
    private String numSerie;

    @Column(nullable = false)
    @NotNull(message = "Campo obligatorio")
    @Enumerated(EnumType.STRING)
    private EstadoEquipo estado;

    @Column(nullable = false)
    @NotNull(message = "Campo obligatorio")
    @Enumerated(EnumType.STRING)
    private CategoriaEquipo categoria;





}
