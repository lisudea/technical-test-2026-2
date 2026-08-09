package udea.lis.equipos_reservas_api.mapper;

import org.junit.jupiter.api.Test;
import udea.lis.equipos_reservas_api.dto.ReservaResponse;
import udea.lis.equipos_reservas_api.model.CategoriaEquipo;
import udea.lis.equipos_reservas_api.model.Equipo;
import udea.lis.equipos_reservas_api.model.EstadoEquipo;
import udea.lis.equipos_reservas_api.model.EstadoReserva;
import udea.lis.equipos_reservas_api.model.Reserva;
import udea.lis.equipos_reservas_api.model.Usuario;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class ReservaMapperTest {

    private final ReservaMapper reservaMapper = new ReservaMapper();

    @Test
    void toResponseMapeaReservaConResumenDeEquipoYUsuario() {
        Equipo equipo = new Equipo("Arduino Uno", "SN-001", CategoriaEquipo.MICROCONTROLADORES, EstadoEquipo.DISPONIBLE);
        equipo.setId(3L);
        Usuario usuario = new Usuario("Juan Pérez", "juan@example.com");
        LocalDateTime inicio = LocalDateTime.of(2026, 8, 10, 8, 0);
        LocalDateTime fin = LocalDateTime.of(2026, 8, 10, 10, 0);
        Reserva reserva = new Reserva(inicio, fin, usuario, equipo);
        reserva.setId(5L);

        ReservaResponse response = reservaMapper.toResponse(reserva);

        assertThat(response.getId()).isEqualTo(5L);
        assertThat(response.getFechaReserva()).isEqualTo(inicio);
        assertThat(response.getFechaDevolucion()).isEqualTo(fin);
        assertThat(response.getEstado()).isEqualTo(EstadoReserva.ACTIVA);
        assertThat(response.getEquipo().getId()).isEqualTo(3L);
        assertThat(response.getEquipo().getNombre()).isEqualTo("Arduino Uno");
        assertThat(response.getUsuario().getNombre()).isEqualTo("Juan Pérez");
        assertThat(response.getUsuario().getCorreo()).isEqualTo("juan@example.com");
    }
}
