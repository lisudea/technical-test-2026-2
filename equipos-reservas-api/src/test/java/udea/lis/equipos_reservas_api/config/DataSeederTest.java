package udea.lis.equipos_reservas_api.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import udea.lis.equipos_reservas_api.model.Equipo;
import udea.lis.equipos_reservas_api.model.EstadoEquipo;
import udea.lis.equipos_reservas_api.model.EstadoReserva;
import udea.lis.equipos_reservas_api.model.Reserva;
import udea.lis.equipos_reservas_api.repository.EquipoRepository;
import udea.lis.equipos_reservas_api.repository.ReservaRepository;
import udea.lis.equipos_reservas_api.repository.UsuarioRepository;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class DataSeederTest {

    @Autowired
    private DataSeeder dataSeeder;

    @Autowired
    private EquipoRepository equipoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ReservaRepository reservaRepository;

    @Test
    @Transactional
    void siembraVeinteEquiposYVeinteReservasConEstadosMezclados() {
        dataSeeder.run();

        assertThat(equipoRepository.count()).isEqualTo(20);
        assertThat(usuarioRepository.count()).isEqualTo(9);
        assertThat(reservaRepository.count()).isEqualTo(20);

        // Las reservas se reparten entre activas, finalizadas y canceladas.
        Map<EstadoReserva, Long> porEstado = reservaRepository.findAll().stream()
                .collect(Collectors.groupingBy(Reserva::getEstado, Collectors.counting()));
        assertThat(porEstado)
                .containsEntry(EstadoReserva.ACTIVA, 7L)
                .containsEntry(EstadoReserva.FINALIZADA, 7L)
                .containsEntry(EstadoReserva.CANCELADA, 6L);

        // Todas las reservas activas tienen la fecha de devolución en el futuro.
        List<Reserva> activas = reservaRepository.findAll().stream()
                .filter(r -> r.getEstado() == EstadoReserva.ACTIVA)
                .toList();
        assertThat(activas).allMatch(r -> r.getFechaDevolucion().isAfter(LocalDateTime.now()));

        // El equipo 1 tiene tres reservas activas que no se solapan entre sí.
        List<Reserva> activasEquipo1 = activas.stream()
                .filter(r -> r.getEquipo().getId() == 1L)
                .sorted(Comparator.comparing(Reserva::getFechaReserva))
                .toList();
        assertThat(activasEquipo1).hasSize(3);
        for (int i = 1; i < activasEquipo1.size(); i++) {
            assertThat(activasEquipo1.get(i).getFechaReserva())
                    .isAfterOrEqualTo(activasEquipo1.get(i - 1).getFechaDevolucion());
        }

        // Los equipos con reservas activas quedan marcados como RESERVADO y los de mantenimiento conservan su estado.
        Equipo arduino = equipoRepository.findById(1L).orElseThrow();
        assertThat(arduino.getEstado()).isEqualTo(EstadoEquipo.RESERVADO);
        assertThat(equipoRepository.findById(4L).orElseThrow().getEstado())
                .isEqualTo(EstadoEquipo.MANTENIMIENTO);

        // Ejecutar el seeder de nuevo no duplica los datos.
        dataSeeder.run();
        assertThat(equipoRepository.count()).isEqualTo(20);
        assertThat(reservaRepository.count()).isEqualTo(20);
    }
}
