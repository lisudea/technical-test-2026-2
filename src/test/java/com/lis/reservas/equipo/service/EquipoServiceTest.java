package com.lis.reservas.equipo.service;

import com.lis.reservas.categoria.entity.Categoria;
import com.lis.reservas.categoria.repository.CategoriaRepository;
import com.lis.reservas.common.dto.PagedResponse;
import com.lis.reservas.common.exception.RecursoNoEncontradoException;
import com.lis.reservas.equipo.dto.EquipoCreateRequest;
import com.lis.reservas.equipo.dto.EquipoResponse;
import com.lis.reservas.equipo.dto.EquipoUpdateRequest;
import com.lis.reservas.equipo.dto.EstadoPatchRequest;
import com.lis.reservas.equipo.entity.Equipo;
import com.lis.reservas.equipo.entity.EstadoEquipo;
import com.lis.reservas.equipo.mapper.EquipoMapper;
import com.lis.reservas.equipo.repository.EquipoRepository;
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
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

/**
 * Pure Mockito unit tests for {@link EquipoService}.
 *
 * <p>Every collaborator is mocked — no Spring context, no database. The
 * dynamic Specification composition is exercised by passing non-blank
 * filters and verifying the repository is called with a non-null
 * {@code Specification}; the exact SQL it compiles to is validated by the
 * integration tests against a real MySQL container.
 */
@ExtendWith(MockitoExtension.class)
class EquipoServiceTest {

    @Mock
    private EquipoRepository equipoRepository;

    @Mock
    private CategoriaRepository categoriaRepository;

    @Mock
    private EquipoMapper equipoMapper;

    @InjectMocks
    private EquipoService equipoService;

    private Categoria categoria;
    private Equipo equipo;
    private EquipoResponse equipoResponse;

    @BeforeEach
    void setUp() {
        categoria = Categoria.builder()
                .idCategoria(1)
                .nombre("Microcontroladores")
                .descripcion("Arduino, ESP32, Raspberry Pi")
                .build();

        equipo = Equipo.builder()
                .idEquipo(1)
                .nombre("Arduino Uno")
                .numeroSerie("ARD-UNO-001")
                .estado(EstadoEquipo.DISPONIBLE)
                .categoria(categoria)
                .build();

        equipoResponse = new EquipoResponse(
                1, "Arduino Uno", "ARD-UNO-001", null, null,
                EstadoEquipo.DISPONIBLE, 1, "Microcontroladores",
                LocalDateTime.parse("2026-08-01T08:00:00"),
                LocalDateTime.parse("2026-08-01T08:00:00"));
    }

    // =================================================================
    // findPaginated
    // =================================================================

    @Test
    @SuppressWarnings("unchecked")
    void findPaginated_withFilters_returnsPagedResponse() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Equipo> page = new PageImpl<>(List.of(equipo), pageable, 1);

        given(equipoRepository.findAll(any(Specification.class), eq(pageable)))
                .willReturn(page);
        given(equipoMapper.toResponse(equipo)).willReturn(equipoResponse);

        PagedResponse<EquipoResponse> result = equipoService.findPaginated(
                "Microcontroladores", "DISPONIBLE", "Arduino", pageable);

        assertThat(result.content()).hasSize(1);
        assertThat(result.totalElements()).isEqualTo(1);
        assertThat(result.content().get(0)).isEqualTo(equipoResponse);
    }

    @Test
    @SuppressWarnings("unchecked")
    void findPaginated_withNullFilters_returnsAll() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Equipo> page = new PageImpl<>(List.of(equipo), pageable, 1);

        given(equipoRepository.findAll(any(Specification.class), eq(pageable)))
                .willReturn(page);
        given(equipoMapper.toResponse(equipo)).willReturn(equipoResponse);

        PagedResponse<EquipoResponse> result = equipoService.findPaginated(
                null, null, null, pageable);

        assertThat(result.content()).hasSize(1);
        assertThat(result.totalElements()).isEqualTo(1);
    }

    // =================================================================
    // findById
    // =================================================================

    @Test
    void findById_validId_returnsEquipoResponse() {
        given(equipoRepository.findById(1)).willReturn(Optional.of(equipo));
        given(equipoMapper.toResponse(equipo)).willReturn(equipoResponse);

        EquipoResponse result = equipoService.findById(1);

        assertThat(result).isEqualTo(equipoResponse);
    }

    @Test
    void findById_notFound_throwsRecursoNoEncontradoException() {
        given(equipoRepository.findById(999)).willReturn(Optional.empty());

        assertThatThrownBy(() -> equipoService.findById(999))
                .isInstanceOf(RecursoNoEncontradoException.class)
                .hasMessageContaining("999");
    }

    // =================================================================
    // create
    // =================================================================

    @Test
    void create_validRequest_returnsEquipoResponse() {
        EquipoCreateRequest request = new EquipoCreateRequest(
                "Arduino Uno", "ARD-UNO-001", null, null, 1);
        Equipo mapped = Equipo.builder()
                .nombre("Arduino Uno")
                .numeroSerie("ARD-UNO-001")
                .build();

        given(categoriaRepository.findById(1)).willReturn(Optional.of(categoria));
        given(equipoMapper.toEntity(request)).willReturn(mapped);
        given(equipoRepository.save(mapped)).willReturn(equipo);
        given(equipoMapper.toResponse(equipo)).willReturn(equipoResponse);

        EquipoResponse result = equipoService.create(request);

        assertThat(result).isEqualTo(equipoResponse);
        assertThat(mapped.getCategoria()).isEqualTo(categoria);
        verify(equipoRepository).save(mapped);
    }

    @Test
    void create_categoriaNotFound_throwsRecursoNoEncontradoException() {
        EquipoCreateRequest request = new EquipoCreateRequest(
                "Arduino Uno", "ARD-UNO-001", null, null, 999);

        given(categoriaRepository.findById(999)).willReturn(Optional.empty());

        assertThatThrownBy(() -> equipoService.create(request))
                .isInstanceOf(RecursoNoEncontradoException.class)
                .hasMessageContaining("Categoria");
    }

    // =================================================================
    // update
    // =================================================================

    @Test
    void update_validRequest_returnsUpdatedEquipoResponse() {
        EquipoUpdateRequest request = new EquipoUpdateRequest(
                "Arduino Uno R4", "ARD-UNO-001", "AA:BB:CC:DD:EE:FF",
                "Placa actualizada", 1);
        EquipoResponse updatedResponse = new EquipoResponse(
                1, "Arduino Uno R4", "ARD-UNO-001", "AA:BB:CC:DD:EE:FF",
                "Placa actualizada", EstadoEquipo.DISPONIBLE, 1,
                "Microcontroladores",
                LocalDateTime.parse("2026-08-01T08:00:00"),
                LocalDateTime.parse("2026-08-02T10:00:00"));

        given(equipoRepository.findById(1)).willReturn(Optional.of(equipo));
        given(categoriaRepository.findById(1)).willReturn(Optional.of(categoria));
        given(equipoRepository.save(equipo)).willReturn(equipo);
        given(equipoMapper.toResponse(equipo)).willReturn(updatedResponse);

        EquipoResponse result = equipoService.update(1, request);

        assertThat(result).isEqualTo(updatedResponse);
        verify(equipoMapper).updateEntity(request, equipo);
        assertThat(equipo.getCategoria()).isEqualTo(categoria);
    }

    @Test
    void update_equipoNotFound_throwsRecursoNoEncontradoException() {
        EquipoUpdateRequest request = new EquipoUpdateRequest(
                "Arduino Uno R4", "ARD-UNO-001", null, null, 1);

        given(equipoRepository.findById(999)).willReturn(Optional.empty());

        assertThatThrownBy(() -> equipoService.update(999, request))
                .isInstanceOf(RecursoNoEncontradoException.class)
                .hasMessageContaining("Equipo");
    }

    // =================================================================
    // patchEstado
    // =================================================================

    @Test
    void patchEstado_validRequest_updatesEstado() {
        EstadoPatchRequest request = new EstadoPatchRequest(EstadoEquipo.MANTENIMIENTO);
        EquipoResponse responseMantenimiento = new EquipoResponse(
                1, "Arduino Uno", "ARD-UNO-001", null, null,
                EstadoEquipo.MANTENIMIENTO, 1, "Microcontroladores",
                LocalDateTime.parse("2026-08-01T08:00:00"),
                LocalDateTime.parse("2026-08-02T10:00:00"));

        given(equipoRepository.findById(1)).willReturn(Optional.of(equipo));
        given(equipoRepository.save(equipo)).willReturn(equipo);
        given(equipoMapper.toResponse(equipo)).willReturn(responseMantenimiento);

        EquipoResponse result = equipoService.patchEstado(1, request);

        assertThat(result.estado()).isEqualTo(EstadoEquipo.MANTENIMIENTO);
        assertThat(equipo.getEstado()).isEqualTo(EstadoEquipo.MANTENIMIENTO);
    }

    @Test
    void patchEstado_equipoNotFound_throwsRecursoNoEncontradoException() {
        EstadoPatchRequest request = new EstadoPatchRequest(EstadoEquipo.MANTENIMIENTO);

        given(equipoRepository.findById(999)).willReturn(Optional.empty());

        assertThatThrownBy(() -> equipoService.patchEstado(999, request))
                .isInstanceOf(RecursoNoEncontradoException.class)
                .hasMessageContaining("Equipo");
    }
}