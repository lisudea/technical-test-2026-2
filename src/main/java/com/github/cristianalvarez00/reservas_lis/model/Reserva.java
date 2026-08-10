package com.github.cristianalvarez00.reservas_lis.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;


/*
ENTIDAD RESERVA:
Relaciona un estudiante con un equipo y guarda la fecha de inicio y fin.
Cada reserva pertenece a un solo equipo y a un solo estudiante.
*/
@Data
@Entity
@Table(name = "reservas")

@NoArgsConstructor
public class Reserva {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Campo obligatorio")
    @Column(nullable = false)
    private LocalDateTime fechaInicio;

    @NotNull(message = "campo obligatorio")
    @Column(nullable = false)
    private LocalDateTime fechaFin;

    @NotNull(message = "campo obligatorio")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "equipo_id")
    private Equipo equipo;

    @NotNull(message = "campo obligatorio")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "estudiante_id")
    private Estudiante estudiante;

}
