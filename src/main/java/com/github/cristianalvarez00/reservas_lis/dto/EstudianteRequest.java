package com.github.cristianalvarez00.reservas_lis.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


/*
ESTUDIANTE REQUEST:
Datos necesarios para registrar un estudiante.
*/
@Data
@AllArgsConstructor
@NoArgsConstructor

public class EstudianteRequest {

    private String nombre;
    private String correo;
}