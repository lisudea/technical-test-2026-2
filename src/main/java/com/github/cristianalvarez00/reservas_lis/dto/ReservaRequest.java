package com.github.cristianalvarez00.reservas_lis.dto;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/*
RESERVA REQUEST:
Datos que manda el usuario para reservar un equipo en una fecha y franja horaria.
*/
@Data
@AllArgsConstructor
@NoArgsConstructor

public class ReservaRequest {
    private LocalDateTime fechaInicio;
    private LocalDateTime fechaFin;
    private Long idEquipo;
    private Long idEstudiante;

}
