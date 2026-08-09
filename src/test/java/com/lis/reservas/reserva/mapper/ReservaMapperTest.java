package com.lis.reservas.reserva.mapper;

import com.lis.reservas.categoria.entity.Categoria;
import com.lis.reservas.equipo.entity.Equipo;
import com.lis.reservas.equipo.entity.EstadoEquipo;
import com.lis.reservas.reserva.dto.ReservaResponse;
import com.lis.reservas.reserva.entity.EstadoReserva;
import com.lis.reservas.reserva.entity.Reserva;
import com.lis.reservas.usuario.entity.Usuario;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for the generated {@link ReservaMapper} implementation.
 */
class ReservaMapperTest {

    private final ReservaMapper mapper = new ReservaMapperImpl();

    @Test
    void toResponseFlattensEquipoAndUsuario() {
        Categoria cat = Categoria.builder().idCategoria(1).nombre("VR").build();
        Equipo equipo = Equipo.builder().idEquipo(3).categoria(cat).nombre("Meta Quest 3")
                .estado(EstadoEquipo.DISPONIBLE).build();
        Usuario usuario = Usuario.builder().idUsuario(11).nombre("Maria Gomez").correo("maria@udea.edu.co").build();
        OffsetDateTime inicio = OffsetDateTime.of(2026, 9, 1, 10, 0, 0, 0, ZoneOffset.ofHours(-5));
        OffsetDateTime fin = OffsetDateTime.of(2026, 9, 1, 12, 0, 0, 0, ZoneOffset.ofHours(-5));
        Reserva reserva = Reserva.builder()
                .idReserva(42L)
                .equipo(equipo).usuario(usuario)
                .fechaHoraInicio(inicio).fechaHoraFin(fin)
                .estado(EstadoReserva.ACTIVA)
                .motivo("Clase")
                .fechaCreacion(LocalDateTime.of(2026, 8, 8, 8, 0))
                .build();

        ReservaResponse response = mapper.toResponse(reserva);

        assertThat(response.idReserva()).isEqualTo(42L);
        assertThat(response.idEquipo()).isEqualTo(3);
        assertThat(response.equipoNombre()).isEqualTo("Meta Quest 3");
        assertThat(response.idUsuario()).isEqualTo(11);
        assertThat(response.usuarioNombre()).isEqualTo("Maria Gomez");
        assertThat(response.correoUsuario()).isEqualTo("maria@udea.edu.co");
        assertThat(response.fechaHoraInicio()).isEqualTo(inicio);
        assertThat(response.fechaHoraFin()).isEqualTo(fin);
        assertThat(response.estado()).isEqualTo(EstadoReserva.ACTIVA);
        assertThat(response.motivo()).isEqualTo("Clase");
        assertThat(response.fechaCreacion()).isNotNull();
        assertThat(response.fechaCancelacion()).isNull();
    }

    @Test
    void toResponseListMapsAllElements() {
        Equipo equipo = Equipo.builder().idEquipo(3).nombre("E1")
                .categoria(Categoria.builder().idCategoria(1).nombre("VR").build())
                .estado(EstadoEquipo.DISPONIBLE).build();
        Usuario usuario = Usuario.builder().idUsuario(11).nombre("U").correo("u@udea.edu.co").build();
        OffsetDateTime inicio = OffsetDateTime.now();
        Reserva a = Reserva.builder().idReserva(1L).equipo(equipo).usuario(usuario)
                .fechaHoraInicio(inicio).fechaHoraFin(inicio.plusHours(1)).estado(EstadoReserva.ACTIVA).build();
        Reserva b = Reserva.builder().idReserva(2L).equipo(equipo).usuario(usuario)
                .fechaHoraInicio(inicio).fechaHoraFin(inicio.plusHours(1)).estado(EstadoReserva.CANCELADA).build();

        List<ReservaResponse> responses = mapper.toResponseList(List.of(a, b));

        assertThat(responses).hasSize(2);
        assertThat(responses).extracting(ReservaResponse::idReserva).containsExactly(1L, 2L);
        assertThat(responses).extracting(ReservaResponse::estado)
                .containsExactly(EstadoReserva.ACTIVA, EstadoReserva.CANCELADA);
    }
}