package udea.lis.equipos_reservas_api.mapper;

import org.junit.jupiter.api.Test;
import udea.lis.equipos_reservas_api.dto.EquipoResponse;
import udea.lis.equipos_reservas_api.model.CategoriaEquipo;
import udea.lis.equipos_reservas_api.model.Equipo;
import udea.lis.equipos_reservas_api.model.EstadoEquipo;

import static org.assertj.core.api.Assertions.assertThat;

class EquipoMapperTest {

    private final EquipoMapper equipoMapper = new EquipoMapper();

    @Test
    void toResponseMapeaTodosLosCampos() {
        Equipo equipo = new Equipo("Arduino Uno", "SN-001", CategoriaEquipo.MICROCONTROLADORES, EstadoEquipo.DISPONIBLE);
        equipo.setId(7L);

        EquipoResponse response = equipoMapper.toResponse(equipo);

        assertThat(response.getId()).isEqualTo(7L);
        assertThat(response.getNombre()).isEqualTo("Arduino Uno");
        assertThat(response.getNumeroSerie()).isEqualTo("SN-001");
        assertThat(response.getCategoria()).isEqualTo(CategoriaEquipo.MICROCONTROLADORES);
        assertThat(response.getEstado()).isEqualTo(EstadoEquipo.DISPONIBLE);
    }
}
