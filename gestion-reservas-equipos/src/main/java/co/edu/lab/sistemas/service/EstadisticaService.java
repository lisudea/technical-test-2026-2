package co.edu.lab.sistemas.service;

import co.edu.lab.sistemas.dto.TopEquipoDTO;
import co.edu.lab.sistemas.exception.InvalidRequestException;
import co.edu.lab.sistemas.repository.ReservaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

// Servicio para estadísticas públicas.
@Service
@RequiredArgsConstructor
public class EstadisticaService {

    private final ReservaRepository reservaRepository;

    public List<TopEquipoDTO> obtenerTopEquipos(LocalDateTime desde, LocalDateTime hasta) {
        if (desde != null && hasta != null && desde.isAfter(hasta)) {
            throw new InvalidRequestException("El rango de fechas es inválido: desde no puede ser posterior a hasta");
        }

        return reservaRepository.findTopEquiposHistoricosNative(desde, hasta, 5)
            .stream()
            .map(this::toTopEquipoDTO)
            .toList();
    }

    private TopEquipoDTO toTopEquipoDTO(Object[] row) {
        return new TopEquipoDTO(
                ((Number) row[0]).longValue(),
                (String) row[1],
                ((Number) row[2]).longValue()
        );
    }
}