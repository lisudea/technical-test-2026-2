package com.lis.backend.service;

import com.lis.backend.dto.CategoriaStatsResponse;
import com.lis.backend.dto.ResumenResponse;
import com.lis.backend.dto.TopEquipoResponse;
import com.lis.backend.entity.CategoriaEquipo;
import com.lis.backend.entity.EstadoEquipo;
import com.lis.backend.entity.EstadoReserva;
import com.lis.backend.repository.EquipoRepository;
import com.lis.backend.repository.ReservaRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class EstadisticaService {

    private final EquipoRepository equipoRepository;
    private final ReservaRepository reservaRepository;

    public EstadisticaService(EquipoRepository equipoRepository, ReservaRepository reservaRepository) {
        this.equipoRepository = equipoRepository;
        this.reservaRepository = reservaRepository;
    }

    public List<TopEquipoResponse> top5() {
        return reservaRepository.topEquipos(PageRequest.of(0, 5))
                .stream()
                .map(row -> {
                    Long equipoId = (Long) row[0];
                    long cantidad = (Long) row[1];
                    var equipo = equipoRepository.findById(equipoId).orElse(null);
                    if (equipo == null) return null;
                    return new TopEquipoResponse(
                            0,
                            equipo.getId(),
                            equipo.getNombre(),
                            equipo.getCategoria().name(),
                            cantidad
                    );
                })
                .filter(java.util.Objects::nonNull)
                .map(new java.util.function.Function<TopEquipoResponse, TopEquipoResponse>() {
                    int pos = 0;
                    @Override
                    public TopEquipoResponse apply(TopEquipoResponse item) {
                        return new TopEquipoResponse(
                                ++pos,
                                item.equipoId(),
                                item.nombre(),
                                item.categoria(),
                                item.cantidadReservas()
                        );
                    }
                })
                .toList();
    }

    public ResumenResponse resumen() {
        long total = equipoRepository.count();
        long reservas = reservaRepository.count();
        long activas = reservaRepository.countByEstado(EstadoReserva.ACTIVA);
        long mantenimiento = equipoRepository.countByEstado(EstadoEquipo.EN_MANTENIMIENTO);

        long reservados = 0;
        long disponibles = 0;
        for (var equipo : equipoRepository.findAll()) {
            if (equipo.getEstado() == EstadoEquipo.EN_MANTENIMIENTO
                    || equipo.getEstado() == EstadoEquipo.RESERVADO) {
                continue;
            }
            if (reservaRepository.contarReservaVigente(equipo.getId(), java.time.LocalDateTime.now()) > 0) {
                reservados++;
            } else {
                disponibles++;
            }
        }

        return new ResumenResponse(total, reservas, activas, disponibles, reservados, mantenimiento);
    }

    public List<CategoriaStatsResponse> categorias() {
        return Arrays.stream(CategoriaEquipo.values())
                .map(c -> new CategoriaStatsResponse(
                        c.name(),
                        equipoRepository.countByCategoria(c),
                        equipoRepository.findAll().stream()
                                .filter(e -> e.getCategoria() == c && e.getEstado() == EstadoEquipo.DISPONIBLE)
                                .filter(e -> reservaRepository.contarReservaVigente(
                                        e.getId(), java.time.LocalDateTime.now()) == 0)
                                .count()
                ))
                .filter(x -> x.total() > 0)
                .toList();
    }
}
