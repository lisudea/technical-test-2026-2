package com.github.cristianalvarez00.reservas_lis.dto;

import com.github.cristianalvarez00.reservas_lis.model.Equipo;
import com.github.cristianalvarez00.reservas_lis.model.Estudiante;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/*
RESERVA RESPONSE:
Información que se devuelve cuando se crea o consulta una reserva.
Incluye el equipo y el estudiante relacionados con ella.
*/
@Data
@AllArgsConstructor
@NoArgsConstructor

public class ReservaResponse {
    private Long reservaId;
    private LocalDateTime fechaInicio;
    private LocalDateTime fechaFin;
    private Equipo equipo;
    private Estudiante estudiante;
}
