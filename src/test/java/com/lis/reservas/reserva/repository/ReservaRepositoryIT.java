package com.lis.reservas.reserva.repository;

import com.lis.reservas.categoria.entity.Categoria;
import com.lis.reservas.categoria.repository.CategoriaRepository;
import com.lis.reservas.equipo.entity.Equipo;
import com.lis.reservas.equipo.entity.EstadoEquipo;
import com.lis.reservas.equipo.repository.EquipoRepository;
import com.lis.reservas.reserva.entity.EstadoReserva;
import com.lis.reservas.reserva.entity.Reserva;
import com.lis.reservas.usuario.entity.Usuario;
import com.lis.reservas.usuario.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.data.domain.PageRequest;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test for the JPA repositories against a real MySQL 8 instance
 * via Testcontainers. {@code @DataJpaTest} keeps the slice thin; with
 * {@code replace = NONE} + {@code @ServiceConnection}, Flyway runs the real
 * V1-V5 migrations against the container so the physical schema (ENUM
 * columns, CHECK, FK, idx_reservas_conflicto) is exercised exactly as in
 * production.
 *
 * <p>The centerpiece is {@link ReservaRepository#findConflictingForUpdate}:
 * the half-open-interval overlap predicate and the {@code estado='activa'}
 * filter are verified against several boundary and isolation cases.
 */
@Testcontainers
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ReservaRepositoryIT {

    private static final ZoneOffset BOG = ZoneOffset.ofHours(-5);

    @Container
    @ServiceConnection
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0")
            .withDatabaseName("reservas_lis")
            .withUsername("test")
            .withPassword("test");

    @Autowired
    private TestEntityManager em;

    @Autowired
    private ReservaRepository reservaRepository;

    @Autowired
    private EquipoRepository equipoRepository;

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // =================================================================
    // Seed / migration sanity
    // =================================================================

    @Test
    void flywaySeedDataIsPresent() {
        // V5 seeds 4 categorias, 10 equipos, 3 usuarios, 5 reservas.
        assertThat(categoriaRepository.count()).isEqualTo(4);
        assertThat(equipoRepository.count()).isEqualTo(10);
        assertThat(usuarioRepository.count()).isEqualTo(3);
        assertThat(reservaRepository.count()).isEqualTo(5);
    }

    @Test
    void categoriaFindByNombreReturnsSeed() {
        assertThat(categoriaRepository.findByNombre("Microcontroladores"))
                .isPresent()
                .get()
                .extracting(Categoria::getDescripcion)
                .asString().contains("Arduino");
    }

    @Test
    void usuarioFindByCorreoReturnsSeedUser() {
        assertThat(usuarioRepository.findByCorreo("maria.gomez@udea.edu.co"))
                .isPresent()
                .get()
                .extracting(Usuario::getNombre)
                .isEqualTo("Maria Gomez Lopez");
        assertThat(usuarioRepository.existsByCorreo("nope@udea.edu.co")).isFalse();
    }

    // =================================================================
    // Equipo search with dynamic filters
    // =================================================================

    @Test
    void equipoSearchFiltersByCategoriaAndEstado() {
        // Categoria 1 = Microcontroladores, seed has 3 equipos (2 disponible)
        var page = equipoRepository.search(1, EstadoEquipo.DISPONIBLE, null,
                PageRequest.of(0, 20));
        assertThat(page.getContent())
                .extracting(Equipo::getNumeroSerie)
                .containsExactlyInAnyOrder("ARD-UNO-001", "ESP32-DK-002", "RPi4-003");
    }

    @Test
    void equipoSearchFiltersByNombreLike() {
        var page = equipoRepository.search(null, null, "Ender", PageRequest.of(0, 20));
        assertThat(page.getContent())
                .extracting(Equipo::getNombre)
                .containsExactly("Creality Ender 3 V2");
    }

    @Test
    void equipoSearchWithAllNullFiltersReturnsEverything() {
        var page = equipoRepository.search(null, null, null, PageRequest.of(0, 5));
        assertThat(page.getTotalElements()).isEqualTo(10);
        assertThat(page.getContent()).hasSize(5);
    }

    // =================================================================
    // CRITICAL: overlap conflict detection (half-open intervals)
    // =================================================================

    @Test
    void findConflictingReturnsActiveOverlappingReserva() {
        // Existing active reserva [10:00, 12:00) on equipo 1.
        Reserva existing = persistActiveReservaOnEquipo(1,
                atTime(10, 0), atTime(12, 0));

        // New window [11:00, 13:00) overlaps -> conflict.
        List<Reserva> conflicts = reservaRepository.findConflictingForUpdate(
                1, atTime(11, 0), atTime(13, 0));

        assertThat(conflicts).extracting(Reserva::getIdReserva)
                .contains(existing.getIdReserva());
    }

    @Test
    void findConflictingIsEmptyForBackToBackAfter() {
        // Existing [10:00, 12:00); new [12:00, 13:00) touches but does not overlap.
        persistActiveReservaOnEquipo(2,
                atTime(10, 0), atTime(12, 0));

        List<Reserva> conflicts = reservaRepository.findConflictingForUpdate(
                2, atTime(12, 0), atTime(13, 0));

        assertThat(conflicts).isEmpty();
    }

    @Test
    void findConflictingIsEmptyForBackToBackBefore() {
        // Existing [10:00, 12:00); new [09:00, 10:00) touches but does not overlap.
        persistActiveReservaOnEquipo(3,
                atTime(10, 0), atTime(12, 0));

        List<Reserva> conflicts = reservaRepository.findConflictingForUpdate(
                3, atTime(9, 0), atTime(10, 0));

        assertThat(conflicts).isEmpty();
    }

    @Test
    void findConflictingIgnoresCancelledReservas() {
        // Cancelled reserva on equipo 1 overlapping the new window must NOT conflict.
        Reserva cancelled = persistReservaOnEquipo(1,
                atTime(10, 0), atTime(12, 0), EstadoReserva.CANCELADA);

        List<Reserva> conflicts = reservaRepository.findConflictingForUpdate(
                1, atTime(11, 0), atTime(13, 0));

        assertThat(conflicts).isEmpty();
        assertThat(cancelled.getEstado()).isEqualTo(EstadoReserva.CANCELADA);
    }

    @Test
    void findConflictingIsolatedPerEquipo() {
        // Active reserva on equipo 4 does not block a different equipo with
        // the same window.
        persistActiveReservaOnEquipo(4,
                atTime(10, 0), atTime(12, 0));

        List<Reserva> conflicts = reservaRepository.findConflictingForUpdate(
                5, atTime(10, 30), atTime(11, 30));

        assertThat(conflicts).isEmpty();
    }

    @Test
    void findConflictingReturnsMultipleWhenSeveralActiveOverlap() {
        // Two active reservas on equipo 6 both overlapping [10:30, 11:30).
        Reserva a = persistActiveReservaOnEquipo(6,
                atTime(10, 0), atTime(11, 0));
        Reserva b = persistActiveReservaOnEquipo(6,
                atTime(11, 0), atTime(12, 0));

        List<Reserva> conflicts = reservaRepository.findConflictingForUpdate(
                6, atTime(10, 30), atTime(11, 30));

        assertThat(conflicts).hasSize(2)
                .extracting(Reserva::getIdReserva)
                .containsExactlyInAnyOrder(a.getIdReserva(), b.getIdReserva());
    }

    // =================================================================
    // Helpers
    // =================================================================

    private Reserva persistActiveReservaOnEquipo(int equipoId, OffsetDateTime inicio, OffsetDateTime fin) {
        return persistReservaOnEquipo(equipoId, inicio, fin, EstadoReserva.ACTIVA);
    }

    private Reserva persistReservaOnEquipo(int equipoId, OffsetDateTime inicio,
                                           OffsetDateTime fin, EstadoReserva estado) {
        Equipo equipo = equipoRepository.findById(equipoId).orElseThrow();
        Usuario usuario = usuarioRepository.findByCorreo("maria.gomez@udea.edu.co").orElseThrow();
        Reserva r = Reserva.builder()
                .equipo(equipo)
                .usuario(usuario)
                .fechaHoraInicio(inicio)
                .fechaHoraFin(fin)
                .estado(estado)
                .motivo("test")
                .build();
        return em.persistAndFlush(r);
    }

    private static OffsetDateTime atTime(int hour, int minute) {
        return OffsetDateTime.of(2026, 9, 1, hour, minute, 0, 0, BOG);
    }
}
