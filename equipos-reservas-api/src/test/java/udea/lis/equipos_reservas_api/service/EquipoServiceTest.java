package udea.lis.equipos_reservas_api.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import udea.lis.equipos_reservas_api.dto.EquipoRequest;
import udea.lis.equipos_reservas_api.dto.EquipoResponse;
import udea.lis.equipos_reservas_api.dto.PageResponse;
import udea.lis.equipos_reservas_api.exception.RecursoDuplicadoException;
import udea.lis.equipos_reservas_api.exception.RecursoNoEncontradoException;
import udea.lis.equipos_reservas_api.mapper.EquipoMapper;
import udea.lis.equipos_reservas_api.model.CategoriaEquipo;
import udea.lis.equipos_reservas_api.model.Equipo;
import udea.lis.equipos_reservas_api.model.EstadoEquipo;
import udea.lis.equipos_reservas_api.repository.EquipoRepository;

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
class EquipoServiceTest {

    @Mock
    private EquipoRepository equipoRepository;

    @Mock
    private EquipoMapper equipoMapper;

    @InjectMocks
    private EquipoService equipoService;

    private EquipoRequest request() {
        return new EquipoRequest(1L, "Arduino Uno", "SN-001", CategoriaEquipo.MICROCONTROLADORES, EstadoEquipo.DISPONIBLE);
    }

    private EquipoResponse response() {
        return new EquipoResponse(1L, "Arduino Uno", "SN-001", CategoriaEquipo.MICROCONTROLADORES, EstadoEquipo.DISPONIBLE);
    }

    @Test
    void registrarCreaEquipoCuandoLaSerieNoExiste() {
        when(equipoRepository.existsById(1L)).thenReturn(false);
        when(equipoRepository.existsByNumeroSerie("SN-001")).thenReturn(false);
        when(equipoRepository.save(any(Equipo.class))).thenAnswer(inv -> inv.getArgument(0));
        when(equipoMapper.toResponse(any(Equipo.class))).thenReturn(response());

        EquipoResponse result = equipoService.registrar(request());

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getNombre()).isEqualTo("Arduino Uno");
        assertThat(result.getNumeroSerie()).isEqualTo("SN-001");
        assertThat(result.getCategoria()).isEqualTo(CategoriaEquipo.MICROCONTROLADORES);
        assertThat(result.getEstado()).isEqualTo(EstadoEquipo.DISPONIBLE);
        verify(equipoRepository).save(any(Equipo.class));
    }

    @Test
    void registrarRechazaIdDuplicado() {
        when(equipoRepository.existsById(1L)).thenReturn(true);

        assertThatThrownBy(() -> equipoService.registrar(request()))
                .isInstanceOf(RecursoDuplicadoException.class)
                .hasMessageContaining("id 1");
        verify(equipoRepository, never()).save(any(Equipo.class));
    }

    @Test
    void registrarRechazaSerieDuplicada() {
        when(equipoRepository.existsById(1L)).thenReturn(false);
        when(equipoRepository.existsByNumeroSerie("SN-001")).thenReturn(true);

        assertThatThrownBy(() -> equipoService.registrar(request()))
                .isInstanceOf(RecursoDuplicadoException.class)
                .hasMessageContaining("SN-001");
        verify(equipoRepository, never()).save(any(Equipo.class));
    }

    @Test
    void actualizarModificaLosCamposDelEquipo() {
        Equipo equipo = new Equipo("Arduino Uno", "SN-001", CategoriaEquipo.MICROCONTROLADORES, EstadoEquipo.DISPONIBLE);
        equipo.setId(1L);
        when(equipoRepository.findById(1L)).thenReturn(Optional.of(equipo));
        when(equipoRepository.save(equipo)).thenAnswer(inv -> inv.getArgument(0));
        when(equipoMapper.toResponse(any(Equipo.class))).thenReturn(
                new EquipoResponse(1L, "Arduino Mega", "SN-002", CategoriaEquipo.REDES, EstadoEquipo.MANTENIMIENTO));
        EquipoRequest update = new EquipoRequest(1L, "Arduino Mega", "SN-002", CategoriaEquipo.REDES, EstadoEquipo.MANTENIMIENTO);

        EquipoResponse response = equipoService.actualizar(update);

        assertThat(response.getNombre()).isEqualTo("Arduino Mega");
        assertThat(response.getNumeroSerie()).isEqualTo("SN-002");
        assertThat(response.getCategoria()).isEqualTo(CategoriaEquipo.REDES);
        assertThat(response.getEstado()).isEqualTo(EstadoEquipo.MANTENIMIENTO);
        verify(equipoRepository).save(equipo);
    }

    @Test
    void actualizarRechazaSerieDuplicadaAlCambiarSerie() {
        Equipo equipo = new Equipo("Arduino Uno", "SN-001", CategoriaEquipo.MICROCONTROLADORES, EstadoEquipo.DISPONIBLE);
        equipo.setId(1L);
        when(equipoRepository.findById(1L)).thenReturn(Optional.of(equipo));
        EquipoRequest update = new EquipoRequest(1L, "Arduino Uno", "SN-999", CategoriaEquipo.MICROCONTROLADORES, EstadoEquipo.DISPONIBLE);
        when(equipoRepository.existsByNumeroSerie("SN-999")).thenReturn(true);

        assertThatThrownBy(() -> equipoService.actualizar(update))
                .isInstanceOf(RecursoDuplicadoException.class);
    }

    @Test
    void actualizarRechazaIdInexistente() {
        when(equipoRepository.findById(99L)).thenReturn(Optional.empty());
        EquipoRequest update = new EquipoRequest(99L, "Arduino Uno", "SN-001", CategoriaEquipo.MICROCONTROLADORES, EstadoEquipo.DISPONIBLE);

        assertThatThrownBy(() -> equipoService.actualizar(update))
                .isInstanceOf(RecursoNoEncontradoException.class)
                .hasMessageContaining("99");
    }

    @Test
    void consultarPorIdLanzaExcepcionCuandoNoExiste() {
        when(equipoRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> equipoService.consultarPorId(99L))
                .isInstanceOf(RecursoNoEncontradoException.class)
                .hasMessageContaining("99");
    }

    @Test
    void listarPaginadoSinFiltrosUsaFindAll() {
        Equipo equipo = new Equipo("Arduino Uno", "SN-001", CategoriaEquipo.MICROCONTROLADORES, EstadoEquipo.DISPONIBLE);
        Pageable pageable = PageRequest.of(0, 10);
        when(equipoRepository.findAll(eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(equipo), pageable, 1));

        PageResponse<EquipoResponse> response = equipoService.listarPaginado(null, null, 0, 10);

        assertThat(response.getContenido()).hasSize(1);
        assertThat(response.getTotalElementos()).isEqualTo(1);
        verify(equipoRepository).findAll(eq(pageable));
    }

    @Test
    void listarPaginadoConFiltroDeCategoriaYEstadoUsaMetodoCombinado() {
        when(equipoRepository.findByCategoriaAndEstado(eq(CategoriaEquipo.VR), eq(EstadoEquipo.DISPONIBLE), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));

        PageResponse<EquipoResponse> response =
                equipoService.listarPaginado(CategoriaEquipo.VR, EstadoEquipo.DISPONIBLE, 0, 10);

        assertThat(response.getContenido()).isEmpty();
        verify(equipoRepository).findByCategoriaAndEstado(eq(CategoriaEquipo.VR), eq(EstadoEquipo.DISPONIBLE), any(Pageable.class));
    }

    @Test
    void listarPaginadoConFiltroSoloCategoriaUsaFindByCategoria() {
        when(equipoRepository.findByCategoria(eq(CategoriaEquipo.REDES), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));

        equipoService.listarPaginado(CategoriaEquipo.REDES, null, 0, 10);

        verify(equipoRepository).findByCategoria(eq(CategoriaEquipo.REDES), any(Pageable.class));
    }

    @Test
    void listarPaginadoConFiltroSoloEstadoUsaFindByEstado() {
        when(equipoRepository.findByEstado(eq(EstadoEquipo.MANTENIMIENTO), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));

        equipoService.listarPaginado(null, EstadoEquipo.MANTENIMIENTO, 0, 10);

        verify(equipoRepository).findByEstado(eq(EstadoEquipo.MANTENIMIENTO), any(Pageable.class));
    }
}
