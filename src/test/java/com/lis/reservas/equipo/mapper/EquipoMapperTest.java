package com.lis.reservas.equipo.mapper;

import com.lis.reservas.categoria.entity.Categoria;
import com.lis.reservas.equipo.dto.EquipoCreateRequest;
import com.lis.reservas.equipo.dto.EquipoResponse;
import com.lis.reservas.equipo.dto.EquipoUpdateRequest;
import com.lis.reservas.equipo.entity.Equipo;
import com.lis.reservas.equipo.entity.EstadoEquipo;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for the generated {@link EquipoMapper} implementation. The
 * MapStruct-generated {@code EquipoMapperImpl} has a public no-arg
 * constructor, so it is instantiated directly — no Spring context needed.
 */
class EquipoMapperTest {

    private final EquipoMapper mapper = new EquipoMapperImpl();

    @Test
    void toResponseFlattensCategoria() {
        Categoria cat = Categoria.builder().idCategoria(2).nombre("VR").build();
        Equipo equipo = Equipo.builder()
                .idEquipo(7)
                .categoria(cat)
                .nombre("Meta Quest 3")
                .numeroSerie("MQ3-001")
                .macAddress("AA:BB:CC:DD:EE:FF")
                .descripcion("Headset")
                .estado(EstadoEquipo.DISPONIBLE)
                .fechaCreacion(LocalDateTime.of(2026, 8, 1, 10, 0))
                .fechaActualizacion(LocalDateTime.of(2026, 8, 2, 9, 30))
                .build();

        EquipoResponse response = mapper.toResponse(equipo);

        assertThat(response.idEquipo()).isEqualTo(7);
        assertThat(response.nombre()).isEqualTo("Meta Quest 3");
        assertThat(response.numeroSerie()).isEqualTo("MQ3-001");
        assertThat(response.macAddress()).isEqualTo("AA:BB:CC:DD:EE:FF");
        assertThat(response.estado()).isEqualTo(EstadoEquipo.DISPONIBLE);
        assertThat(response.idCategoria()).isEqualTo(2);
        assertThat(response.categoriaNombre()).isEqualTo("VR");
        assertThat(response.fechaCreacion()).isNotNull();
    }

    @Test
    void toResponseListMapsAllElements() {
        Categoria cat = Categoria.builder().idCategoria(1).nombre("Microcontroladores").build();
        Equipo a = Equipo.builder().idEquipo(1).categoria(cat).nombre("Arduino").estado(EstadoEquipo.DISPONIBLE).build();
        Equipo b = Equipo.builder().idEquipo(2).categoria(cat).nombre("ESP32").estado(EstadoEquipo.MANTENIMIENTO).build();

        List<EquipoResponse> responses = mapper.toResponseList(List.of(a, b));

        assertThat(responses).hasSize(2);
        assertThat(responses).extracting(EquipoResponse::nombre).containsExactly("Arduino", "ESP32");
        assertThat(responses).extracting(EquipoResponse::categoriaNombre).containsOnly("Microcontroladores");
    }

    @Test
    void toEntityIgnoresCategoriaAndGeneratedFields() {
        var request = new EquipoCreateRequest("Arduino Uno", "ARD-001", null, "Kit", 1);

        Equipo entity = mapper.toEntity(request);

        assertThat(entity.getNombre()).isEqualTo("Arduino Uno");
        assertThat(entity.getNumeroSerie()).isEqualTo("ARD-001");
        assertThat(entity.getDescripcion()).isEqualTo("Kit");
        assertThat(entity.getCategoria()).isNull();
        assertThat(entity.getEstado()).isNull();
        assertThat(entity.getIdEquipo()).isNull();
    }

    @Test
    void updateEntityCopiesUpdatableFieldsLeavingCategoriaAndEstadoUntouched() {
        Categoria cat = Categoria.builder().idCategoria(1).nombre("Microcontroladores").build();
        Equipo existing = Equipo.builder()
                .idEquipo(5).categoria(cat).nombre("Old").numeroSerie("OLD")
                .estado(EstadoEquipo.DISPONIBLE)
                .fechaCreacion(LocalDateTime.of(2026, 1, 1, 0, 0))
                .fechaActualizacion(LocalDateTime.of(2026, 1, 2, 0, 0))
                .build();
        var request = new EquipoUpdateRequest("New Name", "NEW-SN", null, "New desc", 2);

        mapper.updateEntity(request, existing);

        assertThat(existing.getNombre()).isEqualTo("New Name");
        assertThat(existing.getNumeroSerie()).isEqualTo("NEW-SN");
        assertThat(existing.getDescripcion()).isEqualTo("New desc");
        // categoria and estado are NOT touched by the mapper; service owns them
        assertThat(existing.getCategoria()).isEqualTo(cat);
        assertThat(existing.getEstado()).isEqualTo(EstadoEquipo.DISPONIBLE);
        assertThat(existing.getIdEquipo()).isEqualTo(5);
    }
}