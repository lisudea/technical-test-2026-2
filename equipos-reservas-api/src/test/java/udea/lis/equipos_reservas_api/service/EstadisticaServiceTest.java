package udea.lis.equipos_reservas_api.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import udea.lis.equipos_reservas_api.dto.TopEquipoResponse;
import udea.lis.equipos_reservas_api.model.CategoriaEquipo;
import udea.lis.equipos_reservas_api.model.Equipo;
import udea.lis.equipos_reservas_api.model.EstadoEquipo;
import udea.lis.equipos_reservas_api.repository.EquipoRepository;
import udea.lis.equipos_reservas_api.repository.ReservaRepository;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EstadisticaServiceTest {

    @Mock
    private ReservaRepository reservaRepository;

    @Mock
    private EquipoRepository equipoRepository;

    @InjectMocks
    private EstadisticaService estadisticaService;

    @Test
    void top5DevuelveEquiposOrdenadosPorCantidadDeReservasActivas() {
        Equipo arduino = new Equipo("Arduino", "SN-1", CategoriaEquipo.MICROCONTROLADORES, EstadoEquipo.DISPONIBLE);
        arduino.setId(1L);
        Equipo oculus = new Equipo("Oculus", "SN-2", CategoriaEquipo.VR, EstadoEquipo.DISPONIBLE);
        oculus.setId(2L);
        when(reservaRepository.findEquiposMasSolicitados(eq(PageRequest.of(0, 5))))
                .thenReturn(List.of(new Object[]{1L, 12L}, new Object[]{2L, 4L}));
        when(equipoRepository.findById(1L)).thenReturn(Optional.of(arduino));
        when(equipoRepository.findById(2L)).thenReturn(Optional.of(oculus));

        List<TopEquipoResponse> top = estadisticaService.top5EquiposMasSolicitados();

        assertThat(top).hasSize(2);
        assertThat(top.get(0).getEquipoNombre()).isEqualTo("Arduino");
        assertThat(top.get(0).getCantidadReservas()).isEqualTo(12L);
        assertThat(top.get(1).getEquipoNombre()).isEqualTo("Oculus");
        assertThat(top.get(1).getCantidadReservas()).isEqualTo(4L);
        verify(reservaRepository).findEquiposMasSolicitados(eq(PageRequest.of(0, 5)));
    }

    @Test
    void top5OmiteEquiposQueYaNoExisten() {
        when(reservaRepository.findEquiposMasSolicitados(any(Pageable.class)))
                .thenReturn(List.of(new Object[]{1L, 12L}, new Object[]{99L, 3L}));
        Equipo arduino = new Equipo("Arduino", "SN-1", CategoriaEquipo.MICROCONTROLADORES, EstadoEquipo.DISPONIBLE);
        arduino.setId(1L);
        when(equipoRepository.findById(1L)).thenReturn(Optional.of(arduino));
        when(equipoRepository.findById(99L)).thenReturn(Optional.empty());

        List<TopEquipoResponse> top = estadisticaService.top5EquiposMasSolicitados();

        assertThat(top).hasSize(1);
        assertThat(top.get(0).getEquipoId()).isEqualTo(1L);
    }
}
