package com.github.cristianalvarez00.reservas_lis.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/*
ESTADISTICA EQUIPO RESPONSE:
Objeto sencillo para devolver el id, nombre y cantidad de reservas de cada equipo
que aparezca dentro del Top 5.
*/
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EstadisticaEquipoResponse {

    private Long equipoId;
    private String nombre;
    private Long cantidadReservas;
}