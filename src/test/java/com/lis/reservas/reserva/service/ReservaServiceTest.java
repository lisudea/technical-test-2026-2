package com.lis.reservas.reserva.service;

import com.lis.reservas.common.dto.PagedResponse;
import com.lis.reservas.common.exception.EquipoNoDisponibleException;
import com.lis.reservas.common.exception.RecursoNoEncontradoException;
import com.lis.reservas.common.exception.ReservaEnConflictoException;
import com.lis.reservas.common.exception.ValidacionException;
import com.lis.reservas.config.ReservasProperties;
import com.lis.reservas.equipo.entity.Equipo;
import com.lis.reservas.equipo.entity.EstadoEquipo;
import com.lis.reservas.equipo.repository.EquipoRepository;
import com.lis.reservas.reserva.dto.ReservaCreateRequest;
import com.lis.reservas.reserva.dto.ReservaResponse;
import com.lis.reservas.reserva.entity.EstadoReserva;
import com.lis.reservas.reserva.entity.Reserva;
import com.lis.reservas.reserva.mapper.ReservaMapper;
import com.lis.reservas.reserva.repository.ReservaRepository;
import com.lis.reservas.usuario.entity.Usuario;
import com.lis.reservas.usuario.service.UsuarioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

/**
 * Pure Mockito unit tests for {@link ReservaService} — the heart of the
 * system.
 *
 * <p>No Spring context is loaded: every collaborator is a mock, so these
 * tests run in milliseconds and isolate the reservation logic (pre-validation,
 * pessimistic-lock conflict detection, soft-delete cancellation, filtered
 * listing) from the database and the web layer.
 *
 * <p>The concurrency race condition itself is covered by
 * {@code ReservaConcurrencyIT} against a real MySQL 8 container; here we
 * verify the single-threaded decision branches that feed that race.
 */
@ExtendWith(MockitoExtension.class)
class ReservaServiceTest {

    private static final ZoneOffset BOG = ZoneOffset.ofHours(-5);
    private static final Duration MAX_DURATION = Duration.ofHours(8);

    @Mock
    private ReservaRepository reservaRepository;

    @Mock
    private EquipoRepository equipoRepository;

    @Mock
    private UsuarioService usuarioService;

    @Mock
    private ReservaMapper reservaMapper;

    @Mock
    private ReservasProperties reservasProperties;

    @InjectMocks
    private ReservaService reservaService;

    private Equipo equipoDisponible;
    private Usuario usuario;
    private OffsetDateTime inicio;
    private OffsetDateTime fin;

    @BeforeEach
    void setUp() {
        equipoDisponible = Equipo.builder()
                .idEquipo(1)
                .nombre("Arduino Uno")
                .estado(EstadoEquipo.DISPONIBLE)
                .build();

        usuario = Usuario.builder()
                .idUsuario(10)
                .nombre("Maria Gomez")
                .correo("maria.gomez@udea.edu.co")
                .build();

        inicio = OffsetDateTime.now().plusDays(1)
                .withHour(10).withMinute(0).withSecond(0).withNano(0);
        fin = inicio.plusHours(2);
    }

    /**
     * Stub the max-duration only where preValidateWindow is reached —
     * tests that don't call create() never touch this mock.
     */
    private void stubMaxDuration() {
        given(reservasProperties.maxDuration()).willReturn(MAX_DURATION);
    }

    // =================================================================
    // create — happy path
    // =================================================================

    @Test
    void create_validRequest_returnsReservaResponse() {
        stubMaxDuration();
        ReservaCreateRequest request = new ReservaCreateRequest(
                "Maria Gomez", "maria.gomez@udea.edu.co", 1, inicio, fin, "Clase");
        Reserva saved = Reserva.builder()
                .idReserva(42L).equipo(equipoDisponible).usuario(usuario)
                .fechaHoraInicio(inicio).fechaHoraFin(fin)
                .estado(EstadoReserva.ACTIVA).motivo("Clase").build();
        ReservaResponse expected = sampleResponse(42L, EstadoReserva.ACTIVA);

        given(equipoRepository.findById(1)).willReturn(Optional.of(equipoDisponible));
        given(usuarioService.upsertByCorreo("maria.gomez@udea.edu.co", "Maria Gomez"))
                .willReturn(usuario);
        given(equipoRepository.findForUpdate(1)).willReturn(Optional.of(equipoDisponible));
        given(reservaRepository.findConflictingForUpdate(1, inicio, fin))
                .willReturn(List.of());
        given(reservaRepository.save(any(Reserva.class))).willReturn(saved);
        given(reservaMapper.toResponse(saved)).willReturn(expected);

        ReservaResponse result = reservaService.create(request);

        assertThat(result).isEqualTo(expected);
        verify(reservaRepository).findConflictingForUpdate(1, inicio, fin);
    }

    // =================================================================
    // create — conflict (overlapping active reservation)
    // =================================================================

    @Test
    void create_conflictingReservation_throwsReservaEnConflictoException() {
        stubMaxDuration();
        ReservaCreateRequest request = new ReservaCreateRequest(
                "Maria Gomez", "maria.gomez@udea.edu.co", 1, inicio, fin, "Clase");
        Reserva conflict = Reserva.builder()
                .idReserva(5L).equipo(equipoDisponible).usuario(usuario)
                .fechaHoraInicio(inicio).fechaHoraFin(fin)
                .estado(EstadoReserva.ACTIVA).build();

        given(equipoRepository.findById(1)).willReturn(Optional.of(equipoDisponible));
        given(usuarioService.upsertByCorreo("maria.gomez@udea.edu.co", "Maria Gomez"))
                .willReturn(usuario);
        given(equipoRepository.findForUpdate(1)).willReturn(Optional.of(equipoDisponible));
        given(reservaRepository.findConflictingForUpdate(1, inicio, fin))
                .willReturn(List.of(conflict));

        assertThatThrownBy(() -> reservaService.create(request))
                .isInstanceOf(ReservaEnConflictoException.class)
                .hasMessageContaining("conflicto");
    }

    // =================================================================
    // create — equipo not DISPONIBLE
    // =================================================================

    @Test
    void create_equipoNotDisponible_throwsEquipoNoDisponibleException() {
        stubMaxDuration();
        Equipo enMantenimiento = Equipo.builder()
                .idEquipo(1)
                .nombre("Arduino Uno")
                .estado(EstadoEquipo.MANTENIMIENTO)
                .build();
        ReservaCreateRequest request = new ReservaCreateRequest(
                "Maria Gomez", "maria.gomez@udea.edu.co", 1, inicio, fin, "Clase");

        given(equipoRepository.findById(1)).willReturn(Optional.of(enMantenimiento));

        assertThatThrownBy(() -> reservaService.create(request))
                .isInstanceOf(EquipoNoDisponibleException.class)
                .hasMessageContaining("MANTENIMIENTO");
    }

    // =================================================================
    // create — start after end
    // =================================================================

    @Test
    void create_startAfterEnd_throwsValidacionException() {
        OffsetDateTime badInicio = fin.plusHours(1);
        ReservaCreateRequest request = new ReservaCreateRequest(
                "Maria Gomez", "maria.gomez@udea.edu.co", 1, badInicio, fin, "Clase");

        given(equipoRepository.findById(1)).willReturn(Optional.of(equipoDisponible));

        assertThatThrownBy(() -> reservaService.create(request))
                .isInstanceOf(ValidacionException.class)
                .hasMessageContaining("anterior");
    }

    // =================================================================
    // create — start in the past
    // =================================================================

    @Test
    void create_startInPast_throwsValidacionException() {
        OffsetDateTime pastInicio = OffsetDateTime.now().minusDays(1)
                .withHour(10).withMinute(0).withSecond(0).withNano(0);
        OffsetDateTime pastFin = pastInicio.plusHours(2);
        ReservaCreateRequest request = new ReservaCreateRequest(
                "Maria Gomez", "maria.gomez@udea.edu.co", 1, pastInicio, pastFin, "Clase");

        given(equipoRepository.findById(1)).willReturn(Optional.of(equipoDisponible));

        assertThatThrownBy(() -> reservaService.create(request))
                .isInstanceOf(ValidacionException.class)
                .hasMessageContaining("pasado");
    }

    // =================================================================
    // create — exceeds max duration
    // =================================================================

    @Test
    void create_exceedsMaxDuration_throwsValidacionException() {
        stubMaxDuration();
        OffsetDateTime longFin = inicio.plusHours(9);
        ReservaCreateRequest request = new ReservaCreateRequest(
                "Maria Gomez", "maria.gomez@udea.edu.co", 1, inicio, longFin, "Clase");

        given(equipoRepository.findById(1)).willReturn(Optional.of(equipoDisponible));

        assertThatThrownBy(() -> reservaService.create(request))
                .isInstanceOf(ValidacionException.class)
                .hasMessageContaining("maximo");
    }

    // =================================================================
    // create — equipo not found
    // =================================================================

    @Test
    void create_equipoNotFound_throwsRecursoNoEncontradoException() {
        ReservaCreateRequest request = new ReservaCreateRequest(
                "Maria Gomez", "maria.gomez@udea.edu.co", 999, inicio, fin, "Clase");

        given(equipoRepository.findById(999)).willReturn(Optional.empty());

        assertThatThrownBy(() -> reservaService.create(request))
                .isInstanceOf(RecursoNoEncontradoException.class)
                .hasMessageContaining("999");
    }

    // =================================================================
    // cancel — happy path
    // =================================================================

    @Test
    void cancel_validId_returnsCancelledReserva() {
        Reserva activa = Reserva.builder()
                .idReserva(7L).equipo(equipoDisponible).usuario(usuario)
                .fechaHoraInicio(inicio).fechaHoraFin(fin)
                .estado(EstadoReserva.ACTIVA).motivo("Clase").build();
        ReservaResponse cancelledResponse = sampleResponse(7L, EstadoReserva.CANCELADA);

        given(reservaRepository.findById(7L)).willReturn(Optional.of(activa));
        given(reservaRepository.save(any(Reserva.class))).willAnswer(inv -> inv.getArgument(0));
        given(reservaMapper.toResponse(any(Reserva.class))).willReturn(cancelledResponse);

        ReservaResponse result = reservaService.cancel(7L);

        assertThat(result.estado()).isEqualTo(EstadoReserva.CANCELADA);
        assertThat(activa.getEstado()).isEqualTo(EstadoReserva.CANCELADA);
        assertThat(activa.getFechaCancelacion()).isNotNull();
    }

    // =================================================================
    // cancel — not found
    // =================================================================

    @Test
    void cancel_alreadyCancelled_throwsRecursoNoEncontradoException() {
        given(reservaRepository.findById(999L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> reservaService.cancel(999L))
                .isInstanceOf(RecursoNoEncontradoException.class)
                .hasMessageContaining("999");
    }

    // =================================================================
    // findById — happy path
    // =================================================================

    @Test
    void findById_validId_returnsReservaResponse() {
        Reserva reserva = Reserva.builder()
                .idReserva(3L).equipo(equipoDisponible).usuario(usuario)
                .fechaHoraInicio(inicio).fechaHoraFin(fin)
                .estado(EstadoReserva.ACTIVA).motivo("Clase").build();
        ReservaResponse expected = sampleResponse(3L, EstadoReserva.ACTIVA);

        given(reservaRepository.findById(3L)).willReturn(Optional.of(reserva));
        given(reservaMapper.toResponse(reserva)).willReturn(expected);

        ReservaResponse result = reservaService.findById(3L);

        assertThat(result).isEqualTo(expected);
    }

    @Test
    void findById_notFound_throwsRecursoNoEncontradoException() {
        given(reservaRepository.findById(404L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> reservaService.findById(404L))
                .isInstanceOf(RecursoNoEncontradoException.class)
                .hasMessageContaining("404");
    }

    // =================================================================
    // list — filtered, paged response
    // =================================================================

    @Test
    void list_withFilters_returnsPagedResponse() {
        Reserva reserva = Reserva.builder()
                .idReserva(1L).equipo(equipoDisponible).usuario(usuario)
                .fechaHoraInicio(inicio).fechaHoraFin(fin)
                .estado(EstadoReserva.ACTIVA).motivo("Clase").build();
        ReservaResponse response = sampleResponse(1L, EstadoReserva.ACTIVA);
        Pageable pageable = PageRequest.of(0, 20);

        Page<Reserva> page = new PageImpl<>(List.of(reserva), pageable, 1);
        given(reservaRepository.findByFilters(
                eq(1), eq("maria.gomez@udea.edu.co"), eq(inicio), eq(fin),
                eq(EstadoReserva.ACTIVA), eq(pageable)))
                .willReturn(page);
        given(reservaMapper.toResponse(reserva)).willReturn(response);

        PagedResponse<ReservaResponse> result = reservaService.list(
                1, "maria.gomez@udea.edu.co", inicio, fin, "activa", pageable);

        assertThat(result.content()).hasSize(1);
        assertThat(result.totalElements()).isEqualTo(1);
        assertThat(result.content().get(0)).isEqualTo(response);
    }

    @Test
    void list_withNullEstado_returnsAllStates() {
        Reserva reserva = Reserva.builder()
                .idReserva(1L).equipo(equipoDisponible).usuario(usuario)
                .fechaHoraInicio(inicio).fechaHoraFin(fin)
                .estado(EstadoReserva.COMPLETADA).motivo("Clase").build();
        ReservaResponse response = sampleResponse(1L, EstadoReserva.COMPLETADA);
        Pageable pageable = PageRequest.of(0, 10);

        Page<Reserva> page = new PageImpl<>(List.of(reserva), pageable, 1);
        given(reservaRepository.findByFilters(
                eq(null), eq(null), eq(null), eq(null),
                eq(null), eq(pageable)))
                .willReturn(page);
        given(reservaMapper.toResponse(reserva)).willReturn(response);

        PagedResponse<ReservaResponse> result = reservaService.list(
                null, null, null, null, null, pageable);

        assertThat(result.content()).hasSize(1);
        assertThat(result.totalElements()).isEqualTo(1);
    }

    // =================================================================
    // Helpers
    // =================================================================

    private ReservaResponse sampleResponse(long id, EstadoReserva estado) {
        return new ReservaResponse(
                id, 1, "Arduino Uno", 10, "Maria Gomez",
                "maria.gomez@udea.edu.co",
                inicio, fin, estado, "Clase",
                LocalDateTime.parse("2026-08-01T08:00:00"), null);
    }
}