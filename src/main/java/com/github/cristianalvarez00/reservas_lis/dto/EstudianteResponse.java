package com.github.cristianalvarez00.reservas_lis.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/*
ESTUDIANTE RESPONSE:
Datos que se muestran cuando se consulta el listado de estudiantes.
*/
@Data
@AllArgsConstructor
@NoArgsConstructor

public class EstudianteResponse {

    private String nombre;
    private String correo;
    private Long id;
}