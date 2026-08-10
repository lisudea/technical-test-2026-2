package com.github.cristianalvarez00.reservas_lis.model;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/*
ENTIDAD ESTUDIANTE:
Representa a los usuarios que pueden realizar reservas.
El correo es unico para no registrar varias veces a la misma persona.
*/
@Entity
@Table(name = "estudiantes")
@Data

public class Estudiante {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Campo obligatorio")
    @Column(nullable = false)
    private String nombre;

    @NotBlank(message = "Campo obligatorio")
    @Email(message = "Formato invalido")
    @Column(nullable = false, unique = true)
    private String correo;

}

