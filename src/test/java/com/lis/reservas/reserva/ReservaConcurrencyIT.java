package com.lis.reservas.reserva;

import com.lis.reservas.categoria.entity.Categoria;
import com.lis.reservas.categoria.repository.CategoriaRepository;
import com.lis.reservas.common.exception.ReservaEnConflictoException;
import com.lis.reservas.equipo.entity.Equipo;
import com.lis.reservas.equipo.entity.EstadoEquipo;
import com.lis.reservas.equipo.repository.EquipoRepository;
import com.lis.reservas.reserva.dto.ReservaCreateRequest;
import com.lis.reservas.reserva.entity.EstadoReserva;
import com.lis.reservas.reserva.entity.Reserva;
import com.lis.reservas.reserva.repository.ReservaRepository;
import com.lis.reservas.reserva.service.ReservaService;
import com.lis.reservas.usuario.entity.Usuario;
import com.lis.reservas.usuario.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.data.domain.Pageable;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test proving the pessimistic-lock conflict detection is
 * race-free under real concurrency against a live MySQL 8 instance.
 *
 * <p>This is the single most important test of the system: MySQL 8 has no
 * exclusion constraint, so the no-overlap invariant is enforced in the
 * application layer with {@code SELECT ... FOR UPDATE}. If the locking or
 * the transaction boundary is wrong, two threads can both read "no conflict"
 * and both insert — a double booking.
 *
 * <p>The test fires two threads at the same equipo + overlapping window
 * simultaneously, behind a shared starting gate ({@link CountDownLatch}).
 * The {@code @Transactional} + {@code FOR UPDATE} path must serialize them:
 * exactly one succeeds, exactly one receives
 * {@link ReservaEnConflictoException}.
 *
 * <p>Uses {@code @ServiceConnection} so Spring Boot auto-wires the
 * datasource to the Testcontainers MySQL instance; Flyway runs the real
 * V1–V5 migrations so the physical schema (ENUM columns, CHECK, FK,
 * {@code idx_reservas_conflicto}) is exercised exactly as in production.
 */
@Testcontainers
@SpringBootTest(properties = {
        "spring.security.oauth2.client.registration.google.client-id=test-client",
        "spring.security.oauth2.client.registration.google.client-secret=test-secret"
})
class ReservaConcurrencyIT {

    private static final ZoneOffset BOG = ZoneOffset.ofHours(-5);

    @Container
    @ServiceConnection
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0")
            .withDatabaseName("reservas_lis")
            .withUsername("test")
            .withPassword("test");

    @Autowired
    private ReservaService reservaService;

    @Autowired
    private ReservaRepository reservaRepository;

    @Autowired
    private EquipoRepository equipoRepository;

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Test
    void concurrentOverlappingReservations_exactlyOneSucceeds() throws Exception {
        // --- Setup: create a fresh categoria + equipo for this test ------------
        Categoria cat = categoriaRepository.save(Categoria.builder()
                .nombre("Test Cat " + System.nanoTime())
                .descripcion("Concurrency test")
                .build());

        Equipo equipo = equipoRepository.save(Equipo.builder()
                .nombre("Test Equipo " + System.nanoTime())
                .categoria(cat)
                .estado(EstadoEquipo.DISPONIBLE)
                .build());

        // Pre-create the two users so upsert is a no-op (avoids serializing
        // on the unique correo constraint during the race).
        Usuario userA = usuarioRepository.save(Usuario.builder()
                .nombre("User A")
                .correo("usera-" + System.nanoTime() + "@udea.edu.co")
                .build());
        Usuario userB = usuarioRepository.save(Usuario.builder()
                .nombre("User B")
                .correo("userb-" + System.nanoTime() + "@udea.edu.co")
                .build());

        // Two identical overlapping windows on the same equipo.
        OffsetDateTime inicio = OffsetDateTime.now().plusDays(1)
                .withHour(10).withMinute(0).withSecond(0).withNano(0);
        OffsetDateTime fin = inicio.plusHours(2);

        ReservaCreateRequest req1 = new ReservaCreateRequest(
                "User A", userA.getCorreo(), equipo.getIdEquipo(), inicio, fin, "Clase A");
        ReservaCreateRequest req2 = new ReservaCreateRequest(
                "User B", userB.getCorreo(), equipo.getIdEquipo(), inicio, fin, "Clase B");

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);
        AtomicInteger otherErrorCount = new AtomicInteger(0);
        // Capture the unexpected exception for diagnostics.
        final java.util.concurrent.atomic.AtomicReference<Throwable> firstOtherError =
                new java.util.concurrent.atomic.AtomicReference<>();

        // Starting gate: both threads wait until the latch is released,
        // then fire simultaneously to maximize the chance of a race.
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch doneGate = new CountDownLatch(2);

        Thread t1 = new Thread(() -> {
            try {
                startGate.await();
                reservaService.create(req1);
                successCount.incrementAndGet();
            } catch (ReservaEnConflictoException e) {
                conflictCount.incrementAndGet();
            } catch (Exception e) {
                otherErrorCount.incrementAndGet();
                firstOtherError.compareAndSet(null, e);
            } finally {
                doneGate.countDown();
            }
        });

        Thread t2 = new Thread(() -> {
            try {
                startGate.await();
                reservaService.create(req2);
                successCount.incrementAndGet();
            } catch (ReservaEnConflictoException e) {
                conflictCount.incrementAndGet();
            } catch (Exception e) {
                otherErrorCount.incrementAndGet();
                firstOtherError.compareAndSet(null, e);
            } finally {
                doneGate.countDown();
            }
        });

        t1.start();
        t2.start();

        // Give both threads a moment to reach the starting gate.
        Thread.sleep(100);

        // Release both threads simultaneously.
        startGate.countDown();

        // Wait for both to finish (with a generous timeout for CI).
        doneGate.await();
        t1.join(10000);
        t2.join(10000);

        // --- Assertions --------------------------------------------------------
        if (firstOtherError.get() != null) {
            throw new AssertionError("Unexpected exception in a thread",
                    firstOtherError.get());
        }

        assertThat(otherErrorCount.get())
                .as("No unexpected exceptions should occur")
                .isZero();

        assertThat(successCount.get())
                .as("Exactly one reservation must succeed")
                .isEqualTo(1);

        assertThat(conflictCount.get())
                .as("Exactly one reservation must get a 409 conflict")
                .isEqualTo(1);

        // Verify the database has exactly one active reserva for this equipo.
        // Use a simple count (no FOR UPDATE) since we're not in a transaction here.
        var activeReservas = reservaRepository.findByEquipoIdEquipo(
                equipo.getIdEquipo(), Pageable.unpaged());
        var activeCount = activeReservas.getContent().stream()
                .filter(r -> r.getEstado() == EstadoReserva.ACTIVA)
                .count();
        assertThat(activeCount)
                .as("The DB must contain exactly one active overlapping reserva")
                .isEqualTo(1);
    }
}