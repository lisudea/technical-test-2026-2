package com.lis.backend.service;

import com.lis.backend.dto.ReservaRequest;
import com.lis.backend.dto.ReservaResponse;
import com.lis.backend.entity.Equipo;
import com.lis.backend.entity.EstadoEquipo;
import com.lis.backend.entity.EstadoReserva;
import com.lis.backend.entity.Reserva;
import com.lis.backend.exception.BadRequestException;
import com.lis.backend.exception.ConflictException;
import com.lis.backend.exception.ResourceNotFoundException;
import com.lis.backend.repository.ReservaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final EquipoService equipoService;

    public ReservaService(ReservaRepository reservaRepository, EquipoService equipoService) {
        this.reservaRepository = reservaRepository;
        this.equipoService = equipoService;
    }

    public ReservaResponse crear(ReservaRequest request) {
        if (!request.fechaInicio().isBefore(request.fechaFin())) {
            throw new BadRequestException("La fecha/hora de inicio debe ser anterior a la fecha/hora de fin.");
        }

        Equipo equipo = equipoService.findEntity(request.equipoId());

        if (equipo.getEstado() == EstadoEquipo.EN_MANTENIMIENTO
                || equipo.getEstado() == EstadoEquipo.RESERVADO) {
            throw new ConflictException("El equipo no está disponible para reservas porque se encuentra en estado "
                    + equipo.getEstado() + ".");
        }

        long conflictos = reservaRepository.contarConflictos(
                equipo.getId(),
                request.fechaInicio(),
                request.fechaFin()
        );

        if (conflictos > 0) {
            throw new ConflictException(
                    "El equipo ya se encuentra reservado en la franja de tiempo solicitada."
            );
        }

        Reserva reserva = new Reserva();
        reserva.setEquipo(equipo);
        reserva.setNombreUsuario(request.nombreUsuario().trim());
        reserva.setCorreoUsuario(request.correoUsuario().trim().toLowerCase());
        reserva.setFechaInicio(request.fechaInicio());
        reserva.setFechaFin(request.fechaFin());
        reserva.setEstado(EstadoReserva.ACTIVA);

        return toResponse(reservaRepository.save(reserva));
    }

    @Transactional(readOnly = true)
    public Page<ReservaResponse> listar(EstadoReserva estado, Long equipoId,
                                        String correo, Pageable pageable) {
        return reservaRepository.buscar(
                estado,
                equipoId,
                correo == null || correo.isBlank() ? null : correo.trim(),
                pageable
        ).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public ReservaResponse obtener(Long id) {
        return toResponse(findEntity(id));
    }

    @Transactional(readOnly = true)
    public java.util.List<ReservaResponse> listarPorEquipo(Long equipoId) {
        equipoService.findEntity(equipoId);
        return reservaRepository.findByEquipoIdOrderByFechaInicioDesc(equipoId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ReservaResponse cancelar(Long id) {
        Reserva reserva = findEntity(id);

        if (reserva.getEstado() == EstadoReserva.CANCELADA) {
            throw new ConflictException("La reserva ya se encuentra cancelada.");
        }

        reserva.setEstado(EstadoReserva.CANCELADA);
        return toResponse(reservaRepository.save(reserva));
    }

    private Reserva findEntity(Long id) {
        return reservaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada: " + id));
    }

    private ReservaResponse toResponse(Reserva r) {
        return new ReservaResponse(
                r.getId(),
                r.getEquipo().getId(),
                r.getEquipo().getNombre(),
                r.getNombreUsuario(),
                r.getCorreoUsuario(),
                r.getFechaInicio(),
                r.getFechaFin(),
                r.getEstado()
        );
    }
}
