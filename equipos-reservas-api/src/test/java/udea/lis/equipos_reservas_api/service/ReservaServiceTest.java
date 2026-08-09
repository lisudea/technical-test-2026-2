package udea.lis.equipos_reservas_api.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import udea.lis.equipos_reservas_api.dto.PageResponse;
import udea.lis.equipos_reservas_api.dto.ReservaRequest;
import udea.lis.equipos_reservas_api.dto.ReservaResponse;
import udea.lis.equipos_reservas_api.exception.ConflictoReservaException;
import udea.lis.equipos_reservas_api.exception.RecursoNoEncontradoException;
import udea.lis.equipos_reservas_api.mapper.ReservaMapper;
import udea.lis.equipos_reservas_api.model.Equipo;
import udea.lis.equipos_reservas_api.model.EstadoEquipo;
import udea.lis.equipos_reservas_api.model.EstadoReserva;
import udea.lis.equipos_reservas_api.model.Reserva;
import udea.lis.equipos_reservas_api.model.Usuario;
import udea.lis.equipos_reservas_api.repository.EquipoRepository;
import udea.lis.equipos_reservas_api.repository.ReservaRepository;
import udea.lis.equipos_reservas_api.repository.UsuarioRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReservaServiceTest {

    @Mock
    private ReservaRepository reservaRepository;

    @Mock
    private EquipoRepository equipoRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private ReservaMapper reservaMapper;

    @InjectMocks
    private ReservaService reservaService;

    private ReservaResponse responseActiva() {
        return new ReservaResponse(1L, LocalDateTime.of(2026, 8, 10, 8, 0), LocalDateTime.of(2026, 8, 10, 10, 0),
                EstadoReserva.ACTIVA,
                new ReservaResponse.EquipoResumen(1L, "Arduino Uno"),
                new ReservaResponse.UsuarioResumen("Juan Pérez", "juan@example.com"));
    }

    private Equipo equipoDisponible() {
        Equipo equipo = new Equipo("Arduino Uno", "SN-001", udea.lis.equipos_reservas_api.model.CategoriaEquipo.MICROCONTROLADORES,
                EstadoEquipo.DISPONIBLE);
        equipo.setId(1L);
        return equipo;
    }

    private ReservaRequest request(LocalDateTime inicio, LocalDateTime fin) {
        return new ReservaRequest("Juan Pérez", "juan@example.com", 1L, inicio, fin);
    }

    private Reserva reservaActiva(Equipo equipo, LocalDateTime inicio, LocalDateTime fin) {
        Reserva reserva = new Reserva(inicio, fin, new Usuario("Otro Usuario", "otro@example.com"), equipo);
        reserva.setId(10L);
        return reserva;
    }

    @Test
    void crearReservaCreaUsuarioYEquipoPasaAReservado() {
        Equipo equipo = equipoDisponible();
        LocalDateTime inicio = LocalDateTime.of(2026, 8, 10, 8, 0);
        LocalDateTime fin = LocalDateTime.of(2026, 8, 10, 10, 0);
        when(usuarioRepository.findByCorreo("juan@example.com")).thenReturn(Optional.empty());
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> {
            Usuario usuario = inv.getArgument(0);
            usuario.setId(1L);
            return usuario;
        });
        when(equipoRepository.findById(1L)).thenReturn(Optional.of(equipo));
        when(reservaRepository.findConflictos(eq(1L), eq(inicio), eq(fin))).thenReturn(List.of());
        when(reservaRepository.save(any(Reserva.class))).thenAnswer(inv -> inv.getArgument(0));
        when(reservaMapper.toResponse(any(Reserva.class))).thenReturn(responseActiva());

        ReservaResponse response = reservaService.crearReserva(request(inicio, fin));

        assertThat(response.getEstado()).isEqualTo(EstadoReserva.ACTIVA);
        assertThat(response.getUsuario().getNombre()).isEqualTo("Juan Pérez");
        assertThat(response.getEquipo().getNombre()).isEqualTo("Arduino Uno");
        assertThat(equipo.getEstado()).isEqualTo(EstadoEquipo.RESERVADO);
        verify(usuarioRepository).save(any(Usuario.class));
        verify(equipoRepository).save(equipo);
    }

    @Test
    void crearReservaReutilizaUsuarioExistente() {
        Equipo equipo = equipoDisponible();
        Usuario existente = new Usuario("Juan Pérez", "juan@example.com");
        LocalDateTime inicio = LocalDateTime.of(2026, 8, 10, 8, 0);
        LocalDateTime fin = LocalDateTime.of(2026, 8, 10, 10, 0);
        when(usuarioRepository.findByCorreo("juan@example.com")).thenReturn(Optional.of(existente));
        when(equipoRepository.findById(1L)).thenReturn(Optional.of(equipo));
        when(reservaRepository.findConflictos(eq(1L), eq(inicio), eq(fin))).thenReturn(List.of());
        when(reservaRepository.save(any(Reserva.class))).thenAnswer(inv -> inv.getArgument(0));

        reservaService.crearReserva(request(inicio, fin));

        verify(usuarioRepository, never()).save(any(Usuario.class));
    }

    @Test
    void crearReservaLanza404CuandoElEquipoNoExiste() {
        when(equipoRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reservaService.crearReserva(request(
                LocalDateTime.of(2026, 8, 10, 8, 0), LocalDateTime.of(2026, 8, 10, 10, 0))))
                .isInstanceOf(RecursoNoEncontradoException.class)
                .hasMessageContaining("Equipo no encontrado");
    }

    @Test
    void crearReservaLanzaConflictoCuandoElEquipoEstaEnMantenimiento() {
        Equipo equipo = equipoDisponible();
        equipo.setEstado(EstadoEquipo.MANTENIMIENTO);
        when(equipoRepository.findById(1L)).thenReturn(Optional.of(equipo));

        assertThatThrownBy(() -> reservaService.crearReserva(request(
                LocalDateTime.of(2026, 8, 10, 8, 0), LocalDateTime.of(2026, 8, 10, 10, 0))))
                .isInstanceOf(ConflictoReservaException.class)
                .hasMessageContaining("no está disponible");
    }

    @Test
    void crearReservaRechazaFechasInconsistentes() {
        Equipo equipo = equipoDisponible();
        when(equipoRepository.findById(1L)).thenReturn(Optional.of(equipo));

        assertThatThrownBy(() -> reservaService.crearReserva(request(
                LocalDateTime.of(2026, 8, 10, 10, 0), LocalDateTime.of(2026, 8, 10, 8, 0))))
                .isInstanceOf(ConflictoReservaException.class)
                .hasMessageContaining("posterior");
    }

    @Test
    void crearReservaRechazaSolapamientoConOtraActiva() {
        Equipo equipo = equipoDisponible();
        LocalDateTime inicio = LocalDateTime.of(2026, 8, 10, 8, 0);
        LocalDateTime fin = LocalDateTime.of(2026, 8, 10, 10, 0);
        when(equipoRepository.findById(1L)).thenReturn(Optional.of(equipo));
        when(reservaRepository.findConflictos(eq(1L), eq(inicio), eq(fin)))
                .thenReturn(List.of(reservaActiva(equipo, LocalDateTime.of(2026, 8, 10, 9, 0),
                        LocalDateTime.of(2026, 8, 10, 11, 0))));

        assertThatThrownBy(() -> reservaService.crearReserva(request(inicio, fin)))
                .isInstanceOf(ConflictoReservaException.class)
                .hasMessageContaining("ya está reservado");
        verify(reservaRepository, never()).save(any(Reserva.class));
        assertThat(equipo.getEstado()).isEqualTo(EstadoEquipo.DISPONIBLE);
    }

    @Test
    void crearReservaPermiteFranjaAdyacenteSinSolapamiento() {
        Equipo equipo = equipoDisponible();
        LocalDateTime inicio = LocalDateTime.of(2026, 8, 10, 10, 0);
        LocalDateTime fin = LocalDateTime.of(2026, 8, 10, 12, 0);
        when(equipoRepository.findById(1L)).thenReturn(Optional.of(equipo));
        when(usuarioRepository.findByCorreo("juan@example.com")).thenReturn(Optional.empty());
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));
        when(reservaRepository.findConflictos(eq(1L), eq(inicio), eq(fin))).thenReturn(List.of());
        when(reservaRepository.save(any(Reserva.class))).thenAnswer(inv -> inv.getArgument(0));
        when(reservaMapper.toResponse(any(Reserva.class))).thenReturn(responseActiva());

        ReservaResponse response = reservaService.crearReserva(request(inicio, fin));

        assertThat(response.getEstado()).isEqualTo(EstadoReserva.ACTIVA);
    }

    @Test
    void cancelarReservaLiberaElEquipoCuandoNoQuedanActivas() {
        Equipo equipo = equipoDisponible();
        equipo.setEstado(EstadoEquipo.RESERVADO);
        Reserva reserva = reservaActiva(equipo, LocalDateTime.of(2026, 8, 10, 8, 0), LocalDateTime.of(2026, 8, 10, 10, 0));
        when(reservaRepository.findById(10L)).thenReturn(Optional.of(reserva));
        when(reservaRepository.findByEquipoId(1L)).thenReturn(List.of(reserva));
        when(reservaMapper.toResponse(any(Reserva.class))).thenReturn(
                new ReservaResponse(10L, reserva.getFechaReserva(), reserva.getFechaDevolucion(),
                        EstadoReserva.CANCELADA,
                        new ReservaResponse.EquipoResumen(1L, "Arduino Uno"),
                        new ReservaResponse.UsuarioResumen("Otro Usuario", "otro@example.com")));

        ReservaResponse response = reservaService.cancelarReserva(10L);

        assertThat(response.getEstado()).isEqualTo(EstadoReserva.CANCELADA);
        assertThat(equipo.getEstado()).isEqualTo(EstadoEquipo.DISPONIBLE);
        verify(equipoRepository).save(equipo);
    }

    @Test
    void cancelarReservaMantieneEquipoReservadoSiHayOtrasActivas() {
        Equipo equipo = equipoDisponible();
        equipo.setEstado(EstadoEquipo.RESERVADO);
        Reserva reserva = reservaActiva(equipo, LocalDateTime.of(2026, 8, 10, 8, 0), LocalDateTime.of(2026, 8, 10, 10, 0));
        Reserva otraActiva = reservaActiva(equipo, LocalDateTime.of(2026, 8, 11, 8, 0), LocalDateTime.of(2026, 8, 11, 10, 0));
        when(reservaRepository.findById(10L)).thenReturn(Optional.of(reserva));
        when(reservaRepository.findByEquipoId(1L)).thenReturn(List.of(reserva, otraActiva));

        reservaService.cancelarReserva(10L);

        assertThat(equipo.getEstado()).isEqualTo(EstadoEquipo.RESERVADO);
        verify(equipoRepository, never()).save(equipo);
    }

    @Test
    void cancelarReservaLanza404CuandoNoExiste() {
        when(reservaRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reservaService.cancelarReserva(99L))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    void cancelarReservaRechazaDobleCancelacion() {
        Equipo equipo = equipoDisponible();
        Reserva reserva = reservaActiva(equipo, LocalDateTime.of(2026, 8, 10, 8, 0), LocalDateTime.of(2026, 8, 10, 10, 0));
        reserva.setEstado(EstadoReserva.CANCELADA);
        when(reservaRepository.findById(10L)).thenReturn(Optional.of(reserva));

        assertThatThrownBy(() -> reservaService.cancelarReserva(10L))
                .isInstanceOf(ConflictoReservaException.class)
                .hasMessageContaining("ya está cancelada");
    }

    @Test
    void listarReservasConFiltrosCombinadosUsaMetodoEspecifico() {
        when(reservaRepository.findByEquipoIdAndEstado(eq(1L), eq(EstadoReserva.ACTIVA), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));

        PageResponse<ReservaResponse> response =
                reservaService.listarReservas(1L, EstadoReserva.ACTIVA, 0, 10);

        assertThat(response.getContenido()).isEmpty();
        verify(reservaRepository).findByEquipoIdAndEstado(eq(1L), eq(EstadoReserva.ACTIVA), any(Pageable.class));
    }

    @Test
    void listarReservasSinFiltrosUsaFindAll() {
        Pageable pageable = PageRequest.of(0, 10);
        when(reservaRepository.findAll(eq(pageable))).thenReturn(new PageImpl<>(List.of(), pageable, 0));

        reservaService.listarReservas(null, null, 0, 10);

        verify(reservaRepository).findAll(eq(pageable));
    }
}
