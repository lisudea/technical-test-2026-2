package co.edu.lab.sistemas.service;

import co.edu.lab.sistemas.dto.EquipoResumenDTO;
import co.edu.lab.sistemas.dto.ReservaAdminResponseDTO;
import co.edu.lab.sistemas.dto.ReservaRequestDTO;
import co.edu.lab.sistemas.dto.ReservaResponseDTO;
import co.edu.lab.sistemas.enums.EstadoFisico;
import co.edu.lab.sistemas.enums.EstadoReserva;
import co.edu.lab.sistemas.exception.ConflictException;
import co.edu.lab.sistemas.exception.ForbiddenException;
import co.edu.lab.sistemas.exception.InvalidRequestException;
import co.edu.lab.sistemas.exception.ResourceNotFoundException;
import co.edu.lab.sistemas.model.Equipo;
import co.edu.lab.sistemas.model.Reserva;
import co.edu.lab.sistemas.repository.EquipoRepository;
import co.edu.lab.sistemas.repository.ReservaRepository;
import co.edu.lab.sistemas.security.GoogleTokenVerifierService;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

// Servicio para la gestión pública de reservas.
@Service
@RequiredArgsConstructor
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final EquipoRepository equipoRepository;
    private final GoogleTokenVerifierService googleTokenVerifierService;

    @Transactional
    public ReservaResponseDTO crear(ReservaRequestDTO request) {
        String correoVerificado = verificarIdentidadInstitucional(request.googleIdToken());

        validarRangoFechas(request.fechaHoraInicio(), request.fechaHoraFin());

        Equipo equipo = buscarEquipoPorId(request.equipoId());
        validarEquipoDisponible(equipo);
        validarNoSolapamiento(equipo.getId(), request.fechaHoraInicio(), request.fechaHoraFin());

        Reserva reserva = new Reserva();
        reserva.setEquipo(equipo);
        reserva.setUsuarioNombre(request.usuarioNombre());
        reserva.setUsuarioCorreo(correoVerificado);
        reserva.setFechaHoraInicio(request.fechaHoraInicio());
        reserva.setFechaHoraFin(request.fechaHoraFin());
        reserva.setEstadoReserva(EstadoReserva.ACTIVA);

        return toResponseDTO(reservaRepository.save(reserva));
    }

    @Transactional
    public ReservaResponseDTO cancelar(Long id, String googleIdToken) {
        String correoVerificado = verificarIdentidadInstitucional(googleIdToken);

        Reserva reserva = buscarReservaPorId(id);

        if (!reserva.getUsuarioCorreo().equalsIgnoreCase(correoVerificado)) {
            throw new ForbiddenException("no tienes permiso para cancelar esta reserva");
        }

        if (reserva.getEstadoReserva() == EstadoReserva.CANCELADA) {
            throw new ConflictException("la reserva ya se encuentra cancelada");
        }

        reserva.setEstadoReserva(EstadoReserva.CANCELADA);
        return toResponseDTO(reservaRepository.save(reserva));
    }

    @Transactional
    public void eliminarDefinitivamente(Long id) {
        Reserva reserva = buscarReservaPorId(id);
        reservaRepository.delete(reserva);
    }

    @Transactional(readOnly = true)
    public Page<ReservaResponseDTO> listar(Pageable pageable, Long equipoId, EstadoReserva estadoReserva) {
        Specification<Reserva> specification = Specification.where(ReservaSpecification.conEquipoId(equipoId))
                .and(ReservaSpecification.conEstadoReserva(estadoReserva));

        return reservaRepository.findAll(specification, pageable)
                .map(this::toResponseDTO);
    }

    // Servicio para la gestión administrativa de reservas.
    @Transactional(readOnly = true)
    public Page<ReservaAdminResponseDTO> listarAdmin(Pageable pageable, Long equipoId, EstadoReserva estadoReserva) {
        Specification<Reserva> specification = Specification.where(ReservaSpecification.conEquipoId(equipoId))
                .and(ReservaSpecification.conEstadoReserva(estadoReserva));

        return reservaRepository.findAll(specification, pageable)
                .map(this::toAdminResponseDTO);
    }

    // Este si contiene el correo del usuario, solo para uso administrativo.
    private ReservaAdminResponseDTO toAdminResponseDTO(Reserva reserva) {
        return new ReservaAdminResponseDTO(
                reserva.getId(),
                new EquipoResumenDTO(reserva.getEquipo().getId(), reserva.getEquipo().getNombre()),
                reserva.getUsuarioNombre(),
                reserva.getUsuarioCorreo(),
                reserva.getFechaHoraInicio(),
                reserva.getFechaHoraFin(),
                reserva.getEstadoReserva(),
                reserva.getFechaCreacion()
        );
    }

    private void validarRangoFechas(java.time.LocalDateTime fechaHoraInicio, java.time.LocalDateTime fechaHoraFin) {
        if (!fechaHoraFin.isAfter(fechaHoraInicio)) {
            throw new InvalidRequestException("La fechaHoraFin debe ser estrictamente posterior a la fechaHoraInicio");
        }
    }

    private Equipo buscarEquipoPorId(Long equipoId) {
        return equipoRepository.findById(equipoId)
                .orElseThrow(() -> new ResourceNotFoundException("El equipo con id " + equipoId + " no existe"));
    }

    private Reserva buscarReservaPorId(Long id) {
        return reservaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("La reserva con id " + id + " no existe"));
    }

    private void validarEquipoDisponible(Equipo equipo) {
        if (equipo.getEstadoFisico() != EstadoFisico.DISPONIBLE) {
            throw new ConflictException("El equipo no está disponible porque se encuentra en mantenimiento o de baja");
        }
    }

    private void validarNoSolapamiento(Long equipoId, java.time.LocalDateTime nuevaInicio, java.time.LocalDateTime nuevaFin) {
        boolean existeSolape = reservaRepository.existsActivaSolapada(
                equipoId,
                EstadoReserva.ACTIVA,
                nuevaInicio,
                nuevaFin
        );

        if (existeSolape) {
            throw new ConflictException("La reserva solicitada choca con el horario de una reserva activa existente");
        }
    }

    private ReservaResponseDTO toResponseDTO(Reserva reserva) {
        Equipo equipo = reserva.getEquipo();
        EquipoResumenDTO equipoResumen = new EquipoResumenDTO(
                equipo.getId(),
                equipo.getNombre()
        );

        return new ReservaResponseDTO(
                reserva.getId(),
                equipoResumen,
                reserva.getUsuarioNombre(),
                reserva.getFechaHoraInicio(),
                reserva.getFechaHoraFin(),
                reserva.getEstadoReserva(),
                reserva.getFechaCreacion()
        );
    }

    private String verificarIdentidadInstitucional(String googleIdToken) {
        return googleTokenVerifierService.verificarYExtraerCorreo(googleIdToken);
    }
}