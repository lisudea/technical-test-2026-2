package com.lis.reservas.sancion.service;

import com.lis.reservas.auth.CurrentUser;
import com.lis.reservas.common.exception.RecursoNoEncontradoException;
import com.lis.reservas.common.exception.UsuarioSancionadoException;
import com.lis.reservas.common.exception.ValidacionException;
import com.lis.reservas.equipo.entity.Equipo;
import com.lis.reservas.reserva.entity.Reserva;
import com.lis.reservas.sancion.dto.LevantarSancionRequest;
import com.lis.reservas.sancion.dto.SancionCreateRequest;
import com.lis.reservas.sancion.entity.EstadoSancion;
import com.lis.reservas.sancion.entity.OrigenSancion;
import com.lis.reservas.sancion.entity.Sancion;
import com.lis.reservas.sancion.mapper.SancionMapper;
import com.lis.reservas.sancion.repository.SancionRepository;
import com.lis.reservas.usuario.entity.Usuario;
import com.lis.reservas.usuario.service.UsuarioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/**
 * Unit tests for {@link SancionService}.
 *
 * <p>Focus is on the rules that are easy to get subtly wrong: what counts as
 * "in force", the refusal to stack sanctions, and the automatic no-show path
 * — the one an auxiliar triggers without thinking about it.
 */
@ExtendWith(MockitoExtension.class)
class SancionServiceTest {

    @Mock
    private SancionRepository sancionRepository;

    @Mock
    private UsuarioService usuarioService;

    @Mock
    private SancionMapper sancionMapper;

    @Mock
    private CurrentUser currentUser;

    @InjectMocks
    private SancionService sancionService;

    private Usuario objetivo;
    private Usuario admin;

    @BeforeEach
    void setUp() {
        objetivo = Usuario.builder()
                .idUsuario(10).nombre("Maria Gomez").correo("maria.gomez@udea.edu.co").build();
        admin = Usuario.builder()
                .idUsuario(1).nombre("Isaac Mesa").correo("isaac.mesag@udea.edu.co").build();

        lenient().when(currentUser.correoOptional())
                .thenReturn(Optional.of("isaac.mesag@udea.edu.co"));
        lenient().when(usuarioService.findEntityByCorreo("isaac.mesag@udea.edu.co"))
                .thenReturn(admin);
    }

    // =================================================================
    // crear
    // =================================================================

    @Test
    void crear_buildsAWindowOfTheRequestedLengthStartingNow() {
        given(usuarioService.findById(10)).willReturn(objetivo);
        given(sancionRepository.findVigentesByUsuario(any(), any())).willReturn(List.of());
        given(sancionRepository.save(any(Sancion.class))).willAnswer(inv -> inv.getArgument(0));

        sancionService.crear(new SancionCreateRequest(10, "Daño de equipo", 7));

        ArgumentCaptor<Sancion> captor = ArgumentCaptor.forClass(Sancion.class);
        verify(sancionRepository).save(captor.capture());
        Sancion guardada = captor.getValue();

        assertThat(guardada.getUsuario()).isEqualTo(objetivo);
        assertThat(guardada.getEstado()).isEqualTo(EstadoSancion.ACTIVA);
        assertThat(guardada.getOrigen()).isEqualTo(OrigenSancion.MANUAL);
        assertThat(guardada.getCreadaPor()).isEqualTo(admin);
        assertThat(guardada.getFechaFin())
                .isEqualTo(guardada.getFechaInicio().plusDays(7));
    }

    @Test
    void crear_refusesToStackASecondSanctionOnAnAlreadyBarredUser() {
        given(usuarioService.findById(10)).willReturn(objetivo);
        given(sancionRepository.findVigentesByUsuario(any(), any()))
                .willReturn(List.of(sancionVigente()));

        assertThatThrownBy(() -> sancionService.crear(
                new SancionCreateRequest(10, "Otra falta", 3)))
                .isInstanceOf(ValidacionException.class)
                .hasMessageContaining("ya tiene una sancion vigente");

        verify(sancionRepository, never()).save(any());
    }

    // =================================================================
    // verificarPuedeReservar — the guard on the reservation hot path
    // =================================================================

    @Test
    void verificarPuedeReservar_passesWhenNothingIsInForce() {
        given(sancionRepository.findVigentesByUsuario(any(), any())).willReturn(List.of());

        assertThatCode(() -> sancionService.verificarPuedeReservar(objetivo))
                .doesNotThrowAnyException();
    }

    @Test
    void verificarPuedeReservar_rejectionNamesTheReasonAndTheEndDate() {
        given(sancionRepository.findVigentesByUsuario(any(), any()))
                .willReturn(List.of(sancionVigente()));

        // A bare "you are sanctioned" leaves the user with nothing to act on.
        assertThatThrownBy(() -> sancionService.verificarPuedeReservar(objetivo))
                .isInstanceOf(UsuarioSancionadoException.class)
                .hasMessageContaining("No devolvio el equipo")
                .hasMessageContaining("vigente hasta");
    }

    // =================================================================
    // sancionarPorNoReclamar — automatic path
    // =================================================================

    @Test
    void sancionarPorNoReclamar_recordsTheTriggeringReservationAndItsOrigin() {
        Reserva reserva = reservaDeEjemplo();
        given(sancionRepository.existsVigenteByUsuario(any(), any())).willReturn(false);
        given(sancionRepository.save(any(Sancion.class))).willAnswer(inv -> inv.getArgument(0));

        Sancion creada = sancionService.sancionarPorNoReclamar(objetivo, reserva, 7);

        assertThat(creada).isNotNull();
        assertThat(creada.getOrigen()).isEqualTo(OrigenSancion.AUTOMATICA);
        assertThat(creada.getReserva()).isEqualTo(reserva);
        assertThat(creada.getMotivo()).contains("#42").contains("Arduino Uno");
    }

    @Test
    void sancionarPorNoReclamar_doesNothingWhenThePolicyIsDisabled() {
        assertThat(sancionService.sancionarPorNoReclamar(objetivo, reservaDeEjemplo(), 0))
                .isNull();
        verify(sancionRepository, never()).save(any());
    }

    @Test
    void sancionarPorNoReclamar_doesNotExtendAnExistingSanctionBehindAnAdminsBack() {
        given(sancionRepository.existsVigenteByUsuario(any(), any())).willReturn(true);

        assertThat(sancionService.sancionarPorNoReclamar(objetivo, reservaDeEjemplo(), 7))
                .isNull();
        verify(sancionRepository, never()).save(any());
    }

    // =================================================================
    // levantar
    // =================================================================

    @Test
    void levantar_recordsWhoLiftedItAndWhy() {
        Sancion sancion = sancionVigente();
        given(sancionRepository.findById(5L)).willReturn(Optional.of(sancion));
        given(sancionRepository.save(any(Sancion.class))).willAnswer(inv -> inv.getArgument(0));

        sancionService.levantar(5L, new LevantarSancionRequest("Equipo repuesto"));

        assertThat(sancion.getEstado()).isEqualTo(EstadoSancion.LEVANTADA);
        assertThat(sancion.getLevantadaPor()).isEqualTo(admin);
        assertThat(sancion.getObservacionLevantamiento()).isEqualTo("Equipo repuesto");
        assertThat(sancion.getFechaLevantamiento()).isNotNull();
    }

    @Test
    void levantar_rejectsASanctionThatWasAlreadyLifted() {
        Sancion sancion = sancionVigente();
        sancion.setEstado(EstadoSancion.LEVANTADA);
        given(sancionRepository.findById(5L)).willReturn(Optional.of(sancion));

        assertThatThrownBy(() -> sancionService.levantar(5L, null))
                .isInstanceOf(ValidacionException.class)
                .hasMessageContaining("ya fue levantada");
    }

    @Test
    void levantar_unknownIdIsNotFound() {
        given(sancionRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> sancionService.levantar(99L, null))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    // =================================================================
    // estaVigente — the derived-expiry rule
    // =================================================================

    @Test
    void estaVigente_isFalseOnceTheWindowElapsedEvenWhileStillActiva() {
        Sancion expirada = sancionVigente();
        expirada.setFechaFin(LocalDateTime.now().minusMinutes(1));

        // Expiry is derived, not swept: the row stays ACTIVA and simply stops
        // matching. Nothing has to run on a schedule to keep this honest.
        assertThat(expirada.getEstado()).isEqualTo(EstadoSancion.ACTIVA);
        assertThat(expirada.estaVigente()).isFalse();
    }

    @Test
    void estaVigente_isFalseWhenLiftedEvenIfTheWindowHasNotElapsed() {
        Sancion levantada = sancionVigente();
        levantada.setEstado(EstadoSancion.LEVANTADA);

        assertThat(levantada.estaVigente()).isFalse();
    }

    // --- helpers -----------------------------------------------------

    private Sancion sancionVigente() {
        return Sancion.builder()
                .idSancion(5L)
                .usuario(objetivo)
                .motivo("No devolvio el equipo a tiempo")
                .fechaInicio(LocalDateTime.now().minusDays(1))
                .fechaFin(LocalDateTime.now().plusDays(6))
                .estado(EstadoSancion.ACTIVA)
                .origen(OrigenSancion.MANUAL)
                .build();
    }

    private Reserva reservaDeEjemplo() {
        return Reserva.builder()
                .idReserva(42L)
                .usuario(objetivo)
                .equipo(Equipo.builder().idEquipo(1).nombre("Arduino Uno").build())
                .build();
    }
}
