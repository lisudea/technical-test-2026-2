package com.github.cristianalvarez00.reservas_lis.dto;

import com.github.cristianalvarez00.reservas_lis.enums.CategoriaEquipo;
import com.github.cristianalvarez00.reservas_lis.enums.EstadoEquipo;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/*
EQUIPO RESPONSE:
Información del equipo que se devuelve al cliente después de consultar o registrar.
*/
@Data
@AllArgsConstructor
@NoArgsConstructor

public class EquipoResponse {

    private Long equipoId;
    private String nombre;
    private String numSerie;
    private EstadoEquipo estado;
    private CategoriaEquipo categoria;
}
