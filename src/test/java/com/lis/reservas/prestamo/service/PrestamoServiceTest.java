package com.lis.reservas.prestamo.service;

import com.lis.reservas.auth.CurrentUser;
import com.lis.reservas.common.exception.EquipoNoDisponibleException;
import com.lis.reservas.common.exception.RecursoNoEncontradoException;
import com.lis.reservas.common.exception.ValidacionException;
import com.lis.reservas.config.ReservasProperties;
import com.lis.reservas.equipo.entity.Equipo;
import com.lis.reservas.equipo.entity.EstadoEquipo;
import com.lis.reservas.equipo.repository.EquipoRepository;
import com.lis.reservas.prestamo.dto.DevolucionRequest;
import com.lis.reservas.prestamo.dto.EntregaRequest;
import com.lis.reservas.prestamo.dto.NoReclamadoRequest;
import com.lis.reservas.reserva.entity.EstadoPrestamo;
import com.lis.reservas.reserva.entity.EstadoReserva;
import com.lis.reservas.reserva.entity.Reserva;
import com.lis.reservas.reserva.mapper.ReservaMapper;
import com.lis.reservas.reserva.repository.ReservaRepository;
import com.lis.reservas.sancion.service.SancionService;
import com.lis.reservas.usuario.entity.Usuario;
import com.lis.reservas.usuario.service.UsuarioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/**
 * Unit tests for {@link PrestamoService} — the auxiliar's loan desk.
 *
 * <p>The interesting surface is the state machine and its timing guards.
 * Each illegal transition and each boundary gets its own case, because these
 * are the rules that quietly corrupt the inventory when they are wrong:
 * equipment marked returned that never left, or handed out hours early and
 * breaking a booking the overlap check cannot see.
 */
@ExtendWith(MockitoExtension.class)
class PrestamoServiceTest {

    private static final Duration TOLERANCIA = Duration.ofMinutes(30);
    private static final Duration MARGEN_NO_RECLAMADO = Duration.ofHours(1);

    @Mock
    private ReservaRepository reservaRepository;

    @Mock
    private EquipoRepository equipoRepository;

    @Mock
    private ReservaMapper reservaMapper;

    @Mock
    private UsuarioService usuarioService;

    @Mock
    private SancionService sancionService;

    @Mock
    private ReservasProperties reservasProperties;

    @Mock
    private CurrentUser currentUser;

    @InjectMocks
    private PrestamoService prestamoService;

    private Equipo equipo;
    private Usuario estudiante;
    private Usuario auxiliar;

    @BeforeEach
    void setUp() {
        equipo = Equipo.builder()
                .idEquipo(1).nombre("Arduino Uno").estado(EstadoEquipo.DISPONIBLE).build();
        estudiante = Usuario.builder()
                .idUsuario(10).nombre("Maria Gomez").correo("maria.gomez@udea.edu.co").build();
        auxiliar = Usuario.builder()
                .idUsuario(3).nombre("Ana Torres").correo("ana.torres@udea.edu.co").build();

        lenient().when(currentUser.correoOptional())
                .thenReturn(Optional.of("ana.torres@udea.edu.co"));
        lenient().when(usuarioService.findEntityByCorreo("ana.torres@udea.edu.co"))
                .thenReturn(auxiliar);
    }

    // =================================================================
    // entregar
    // =================================================================

    @Test
    void entregar_withinTheWindow_movesToEntregadoAndStampsTheAuxiliar() {
        stubTolerancia();
        Reserva reserva = reservaEnCurso();
        given(reservaRepository.findById(42L)).willReturn(Optional.of(reserva));
        given(reservaRepository.save(any(Reserva.class))).willAnswer(inv -> inv.getArgument(0));

        prestamoService.entregar(42L, new EntregaRequest("Sin rayones"));

        assertThat(reserva.getEstadoPrestamo()).isEqualTo(EstadoPrestamo.ENTREGADO);
        assertThat(reserva.getFechaEntrega()).isNotNull();
        assertThat(reserva.getEntregadoPor()).isEqualTo(auxiliar);
        assertThat(reserva.getObservacionesPrestamo()).isEqualTo("Sin rayones");
        // The booking itself is untouched: it still occupies the slot.
        assertThat(reserva.getEstado()).isEqualTo(EstadoReserva.ACTIVA);
    }

    @Test
    void entregar_tooEarly_isRefusedWithTheOpeningTime() {
        stubTolerancia();
        Reserva reserva = reservaEnCurso();
        // Starts in 3 hours; tolerance is only 30 minutes.
        reserva.setFechaHoraInicio(OffsetDateTime.now(Reserva.ZONA).plusHours(3));
        reserva.setFechaHoraFin(OffsetDateTime.now(Reserva.ZONA).plusHours(5));
        given(reservaRepository.findById(42L)).willReturn(Optional.of(reserva));

        // Handing equipment out early silently breaks the next booking: the
        // overlap check knows about reserved windows, not about a device that
        // is physically gone.
        assertThatThrownBy(() -> prestamoService.entregar(42L, null))
                .isInstanceOf(ValidacionException.class)
                .hasMessageContaining("la ventana abre");
        verify(reservaRepository, never()).save(any());
    }

    @Test
    void entregar_afterTheWindowClosed_isRefused() {
        stubTolerancia();
        Reserva reserva = reservaEnCurso();
        reserva.setFechaHoraInicio(OffsetDateTime.now(Reserva.ZONA).minusHours(5));
        reserva.setFechaHoraFin(OffsetDateTime.now(Reserva.ZONA).minusHours(1));
        given(reservaRepository.findById(42L)).willReturn(Optional.of(reserva));

        assertThatThrownBy(() -> prestamoService.entregar(42L, null))
                .isInstanceOf(ValidacionException.class)
                .hasMessageContaining("ya termino");
    }

    @Test
    void entregar_decommissionedEquipment_isRefused() {
        Reserva reserva = reservaEnCurso();
        reserva.getEquipo().setEstado(EstadoEquipo.BAJA);
        given(reservaRepository.findById(42L)).willReturn(Optional.of(reserva));

        assertThatThrownBy(() -> prestamoService.entregar(42L, null))
                .isInstanceOf(EquipoNoDisponibleException.class);
    }

    @Test
    void entregar_anAlreadyDeliveredLoan_isRefusedNamingBothStates() {
        Reserva reserva = reservaEnCurso();
        reserva.setEstadoPrestamo(EstadoPrestamo.ENTREGADO);
        given(reservaRepository.findById(42L)).willReturn(Optional.of(reserva));

        assertThatThrownBy(() -> prestamoService.entregar(42L, null))
                .isInstanceOf(ValidacionException.class)
                .hasMessageContaining("ENTREGADO")
                .hasMessageContaining("PENDIENTE");
    }

    @Test
    void entregar_aCancelledBooking_isRefused() {
        Reserva reserva = reservaEnCurso();
        reserva.setEstado(EstadoReserva.CANCELADA);
        given(reservaRepository.findById(42L)).willReturn(Optional.of(reserva));

        assertThatThrownBy(() -> prestamoService.entregar(42L, null))
                .isInstanceOf(ValidacionException.class)
                .hasMessageContaining("ACTIVA");
    }

    @Test
    void entregar_unknownReserva_isNotFound() {
        given(reservaRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> prestamoService.entregar(99L, null))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    // =================================================================
    // devolver
    // =================================================================

    @Test
    void devolver_completesTheBookingAndKeepsTheHandOverNote() {
        Reserva reserva = reservaEnCurso();
        reserva.setEstadoPrestamo(EstadoPrestamo.ENTREGADO);
        reserva.setObservacionesPrestamo("Sin rayones");
        given(reservaRepository.findById(42L)).willReturn(Optional.of(reserva));
        given(reservaRepository.save(any(Reserva.class))).willAnswer(inv -> inv.getArgument(0));

        prestamoService.devolver(42L, new DevolucionRequest("Devuelto completo", false));

        assertThat(reserva.getEstadoPrestamo()).isEqualTo(EstadoPrestamo.DEVUELTO);
        assertThat(reserva.getEstado()).isEqualTo(EstadoReserva.COMPLETADA);
        assertThat(reserva.getRecibidoPor()).isEqualTo(auxiliar);
        // The return note must not erase what was recorded at hand-over.
        assertThat(reserva.getObservacionesPrestamo())
                .isEqualTo("Sin rayones | Devuelto completo");
    }

    @Test
    void devolver_flaggingDamage_sendsTheEquipmentToMaintenanceImmediately() {
        Reserva reserva = reservaEnCurso();
        reserva.setEstadoPrestamo(EstadoPrestamo.ENTREGADO);
        given(reservaRepository.findById(42L)).willReturn(Optional.of(reserva));
        given(reservaRepository.save(any(Reserva.class))).willAnswer(inv -> inv.getArgument(0));

        prestamoService.devolver(42L, new DevolucionRequest("Puerto USB roto", true));

        assertThat(equipo.getEstado()).isEqualTo(EstadoEquipo.MANTENIMIENTO);
        verify(equipoRepository).save(equipo);
    }

    @Test
    void devolver_somethingThatNeverLeftTheCounter_isRefused() {
        Reserva reserva = reservaEnCurso(); // still PENDIENTE
        given(reservaRepository.findById(42L)).willReturn(Optional.of(reserva));

        assertThatThrownBy(() -> prestamoService.devolver(42L, null))
                .isInstanceOf(ValidacionException.class)
                .hasMessageContaining("PENDIENTE");
        verify(equipoRepository, never()).save(any());
    }

    // =================================================================
    // marcarNoReclamado
    // =================================================================

    @Test
    void marcarNoReclamado_afterTheGracePeriod_cancelsTheBookingToFreeTheSlot() {
        stubMargen();
        Reserva reserva = reservaEnCurso();
        reserva.setFechaHoraInicio(OffsetDateTime.now(Reserva.ZONA).minusHours(3));
        reserva.setFechaHoraFin(OffsetDateTime.now(Reserva.ZONA).plusHours(1));
        given(reservaRepository.findById(42L)).willReturn(Optional.of(reserva));
        given(reservaRepository.save(any(Reserva.class))).willAnswer(inv -> inv.getArgument(0));

        prestamoService.marcarNoReclamado(42L, new NoReclamadoRequest("No se presento", false));

        assertThat(reserva.getEstadoPrestamo()).isEqualTo(EstadoPrestamo.NO_RECLAMADO);
        // Freeing the window matters: an unclaimed booking should not keep
        // blocking the equipment for the rest of its slot.
        assertThat(reserva.getEstado()).isEqualTo(EstadoReserva.CANCELADA);
        assertThat(reserva.getFechaCancelacion()).isNotNull();
        verify(sancionService, never()).sancionarPorNoReclamar(any(), any(), org.mockito.ArgumentMatchers.anyInt());
    }

    @Test
    void marcarNoReclamado_withSancionar_appliesTheConfiguredPolicyLength() {
        stubMargen();
        given(reservasProperties.sanciones())
                .willReturn(new ReservasProperties.Sanciones(7));
        Reserva reserva = reservaEnCurso();
        reserva.setFechaHoraInicio(OffsetDateTime.now(Reserva.ZONA).minusHours(3));
        reserva.setFechaHoraFin(OffsetDateTime.now(Reserva.ZONA).plusHours(1));
        given(reservaRepository.findById(42L)).willReturn(Optional.of(reserva));
        given(reservaRepository.save(any(Reserva.class))).willAnswer(inv -> inv.getArgument(0));

        prestamoService.marcarNoReclamado(42L, new NoReclamadoRequest("No se presento", true));

        verify(sancionService).sancionarPorNoReclamar(eq(estudiante), any(Reserva.class), eq(7));
    }

    @Test
    void marcarNoReclamado_beforeTheGracePeriodElapsed_isRefused() {
        stubMargen();
        Reserva reserva = reservaEnCurso(); // started 5 minutes ago
        given(reservaRepository.findById(42L)).willReturn(Optional.of(reserva));

        // A student stuck in traffic should not be sanctioned two minutes
        // past the hour.
        assertThatThrownBy(() -> prestamoService.marcarNoReclamado(42L, null))
                .isInstanceOf(ValidacionException.class)
                .hasMessageContaining("margen hasta");
        verify(reservaRepository, never()).save(any());
    }

    @Test
    void marcarNoReclamado_afterTheEquipmentWasAlreadyHandedOver_isRefused() {
        Reserva reserva = reservaEnCurso();
        reserva.setEstadoPrestamo(EstadoPrestamo.ENTREGADO);
        given(reservaRepository.findById(42L)).willReturn(Optional.of(reserva));

        assertThatThrownBy(() -> prestamoService.marcarNoReclamado(42L, null))
                .isInstanceOf(ValidacionException.class)
                .hasMessageContaining("ENTREGADO");
    }

    // --- helpers -----------------------------------------------------

    /** A booking that started 5 minutes ago and runs for two more hours. */
    private Reserva reservaEnCurso() {
        return Reserva.builder()
                .idReserva(42L)
                .equipo(equipo)
                .usuario(estudiante)
                .fechaHoraInicio(OffsetDateTime.now(Reserva.ZONA).minusMinutes(5))
                .fechaHoraFin(OffsetDateTime.now(Reserva.ZONA).plusHours(2))
                .estado(EstadoReserva.ACTIVA)
                .estadoPrestamo(EstadoPrestamo.PENDIENTE)
                .build();
    }

    private void stubTolerancia() {
        given(reservasProperties.prestamo())
                .willReturn(new ReservasProperties.Prestamo(TOLERANCIA, MARGEN_NO_RECLAMADO));
    }

    private void stubMargen() {
        given(reservasProperties.prestamo())
                .willReturn(new ReservasProperties.Prestamo(TOLERANCIA, MARGEN_NO_RECLAMADO));
    }
}
