package com.github.cristianalvarez00.reservas_lis.dto;
import com.github.cristianalvarez00.reservas_lis.enums.CategoriaEquipo;
import com.github.cristianalvarez00.reservas_lis.enums.EstadoEquipo;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


/*
EQUIPO REQUEST:
Datos que se reciben desde el cliente al momento de registrar un equipo.
*/
@Data
@AllArgsConstructor
@NoArgsConstructor

public class EquipoRequest {
    private String nombre;
    private String numSerie;
    private CategoriaEquipo categoriaEquipo;
    private EstadoEquipo estadoEquipo;
}
