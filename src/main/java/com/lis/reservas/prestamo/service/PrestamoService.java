package com.lis.reservas.prestamo.service;

import com.lis.reservas.auth.CurrentUser;
import com.lis.reservas.common.dto.PagedResponse;
import com.lis.reservas.common.exception.EquipoNoDisponibleException;
import com.lis.reservas.common.exception.RecursoNoEncontradoException;
import com.lis.reservas.common.exception.ValidacionException;
import com.lis.reservas.config.ReservasProperties;
import com.lis.reservas.equipo.entity.Equipo;
import com.lis.reservas.equipo.entity.EstadoEquipo;
import com.lis.reservas.equipo.repository.EquipoRepository;
import com.lis.reservas.prestamo.dto.DevolucionRequest;
import com.lis.reservas.prestamo.dto.EntregaRequest;
import com.lis.reservas.prestamo.dto.NoReclamadoRequest;
import com.lis.reservas.prestamo.dto.ResumenPrestamosResponse;
import com.lis.reservas.reserva.dto.ReservaResponse;
import com.lis.reservas.reserva.entity.EstadoPrestamo;
import com.lis.reservas.reserva.entity.EstadoReserva;
import com.lis.reservas.reserva.entity.Reserva;
import com.lis.reservas.reserva.mapper.ReservaMapper;
import com.lis.reservas.reserva.repository.ReservaRepository;
import com.lis.reservas.sancion.service.SancionService;
import com.lis.reservas.usuario.entity.Usuario;
import com.lis.reservas.usuario.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;

/**
 * The loan desk: what an auxiliar actually does during a shift.
 *
 * <p>A reservation is a promise; a loan is the physical fact. This service
 * owns the transition between them, and it is the only place allowed to move
 * {@link EstadoPrestamo}. The legal transitions are:
 *
 * <pre>
 *   PENDIENTE --entregar-----&gt; ENTREGADO --devolver--&gt; DEVUELTO
 *       |
 *       +------marcarNoReclamado------------------&gt; NO_RECLAMADO
 * </pre>
 *
 * <p>Everything else is rejected with a 400 naming the current state. The
 * terminal states are terminal: re-delivering a returned booking, or
 * returning something that never left, are bugs in the caller, not
 * situations to accommodate silently.
 *
 * <h2>Why the timing rules exist</h2>
 *
 * <p>Hand-over is refused before {@code inicio - toleranciaEntrega} and after
 * the window closes. Without the lower bound an auxiliar could hand out
 * equipment hours early and quietly break the next booking, which the overlap
 * check cannot see — it only knows about reserved windows, not about a device
 * that is physically gone. Without the upper bound a lapsed booking could be
 * revived long after someone else's slot started.
 *
 * <p>A no-show may only be declared after {@code inicio + margenNoReclamado},
 * so a student caught in traffic is not sanctioned two minutes past the hour.
 *
 * <p>All timestamps and actors are derived server-side, from the clock and
 * the token. A client cannot backdate a hand-over or attribute one to a
 * colleague.
 */
@Service
@RequiredArgsConstructor
public class PrestamoService {

    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");

    private final ReservaRepository reservaRepository;
    private final EquipoRepository equipoRepository;
    private final ReservaMapper reservaMapper;
    private final UsuarioService usuarioService;
    private final SancionService sancionService;
    private final ReservasProperties reservasProperties;
    private final CurrentUser currentUser;

    /**
     * The day's working queue, plus any equipment still out from earlier days.
     *
     * @param fecha          the day to show; defaults to today when null.
     * @param estadoPrestamo optional exact loan-state filter.
     */
    @Transactional(readOnly = true)
    public PagedResponse<ReservaResponse> agenda(LocalDate fecha, String estadoPrestamo,
                                                 Pageable pageable) {
        LocalDate dia = fecha == null ? LocalDate.now(Reserva.ZONA) : fecha;
        EstadoPrestamo filtro = parseEstadoPrestamo(estadoPrestamo);

        Page<Reserva> page = reservaRepository.agenda(
                inicioDelDia(dia), inicioDelDia(dia.plusDays(1)), filtro, pageable);
        return PagedResponse.from(page.map(reservaMapper::toResponse));
    }

    /** Counters for the console header, scoped to {@code fecha}. */
    @Transactional(readOnly = true)
    public ResumenPrestamosResponse resumen(LocalDate fecha) {
        LocalDate dia = fecha == null ? LocalDate.now(Reserva.ZONA) : fecha;
        OffsetDateTime desde = inicioDelDia(dia);
        OffsetDateTime hasta = inicioDelDia(dia.plusDays(1));

        return new ResumenPrestamosResponse(
                reservaRepository.contarPorEstadoPrestamoEnDia(desde, hasta, EstadoPrestamo.PENDIENTE),
                reservaRepository.contarPorEstadoPrestamoEnDia(desde, hasta, EstadoPrestamo.ENTREGADO),
                reservaRepository.contarPorEstadoPrestamoEnDia(desde, hasta, EstadoPrestamo.DEVUELTO),
                reservaRepository.contarPorEstadoPrestamoEnDia(desde, hasta, EstadoPrestamo.NO_RECLAMADO),
                reservaRepository.contarVencidos(OffsetDateTime.now(Reserva.ZONA)));
    }

    /**
     * Validate the hand-over: the equipment physically leaves the counter.
     *
     * @throws RecursoNoEncontradoException if the reserva does not exist.
     * @throws ValidacionException if the booking is not ACTIVA, the loan is
     *         not PENDIENTE, or the current time is outside the hand-over
     *         window.
     * @throws EquipoNoDisponibleException if the equipment has been
     *         decommissioned since the booking was made.
     */
    @Transactional
    public ReservaResponse entregar(Long idReserva, EntregaRequest request) {
        Reserva reserva = cargar(idReserva);
        exigirEstadoPrestamo(reserva, EstadoPrestamo.PENDIENTE, "entregar");

        if (reserva.getEstado() != EstadoReserva.ACTIVA) {
            throw new ValidacionException(
                    "Solo se puede entregar una reserva ACTIVA (estado actual: "
                            + reserva.getEstado() + ")");
        }
        if (reserva.getEquipo().getEstado() == EstadoEquipo.BAJA) {
            throw new EquipoNoDisponibleException(
                    "El equipo esta dado de baja y no puede entregarse");
        }

        OffsetDateTime ahora = OffsetDateTime.now(Reserva.ZONA);
        OffsetDateTime aperturaVentana = reserva.getFechaHoraInicio()
                .minus(reservasProperties.prestamo().toleranciaEntrega());

        if (ahora.isBefore(aperturaVentana)) {
            throw new ValidacionException(
                    "Aun no se puede entregar: la ventana abre a las "
                            + aperturaVentana.format(HORA));
        }
        if (!ahora.isBefore(reserva.getFechaHoraFin())) {
            throw new ValidacionException(
                    "La franja de la reserva ya termino; no se puede entregar");
        }

        reserva.setEstadoPrestamo(EstadoPrestamo.ENTREGADO);
        reserva.setFechaEntrega(LocalDateTime.now());
        reserva.setEntregadoPor(auxiliarActual());
        acumularObservacion(reserva, request == null ? null : request.observaciones());

        return reservaMapper.toResponse(reservaRepository.save(reserva));
    }

    /**
     * Check the equipment back in. Completes the booking, and optionally
     * sends the equipment straight to maintenance.
     *
     * @throws ValidacionException if the loan is not ENTREGADO.
     */
    @Transactional
    public ReservaResponse devolver(Long idReserva, DevolucionRequest request) {
        Reserva reserva = cargar(idReserva);
        exigirEstadoPrestamo(reserva, EstadoPrestamo.ENTREGADO, "devolver");

        reserva.setEstadoPrestamo(EstadoPrestamo.DEVUELTO);
        reserva.setFechaDevolucion(LocalDateTime.now());
        reserva.setRecibidoPor(auxiliarActual());
        reserva.setEstado(EstadoReserva.COMPLETADA);
        acumularObservacion(reserva, request == null ? null : request.observaciones());

        // Damage is discovered at the counter. Flagging it here moves the
        // equipment out of circulation immediately, instead of hoping someone
        // remembers to do it before the next student books the broken unit.
        if (request != null && request.requiereMantenimiento()) {
            Equipo equipo = reserva.getEquipo();
            equipo.setEstado(EstadoEquipo.MANTENIMIENTO);
            equipoRepository.save(equipo);
        }

        return reservaMapper.toResponse(reservaRepository.save(reserva));
    }

    /**
     * Declare a no-show. Cancels the booking so the slot is released, and
     * optionally raises the configured automatic sanction.
     *
     * @throws ValidacionException if the loan is not PENDIENTE, or the grace
     *         period after the start time has not elapsed yet.
     */
    @Transactional
    public ReservaResponse marcarNoReclamado(Long idReserva, NoReclamadoRequest request) {
        Reserva reserva = cargar(idReserva);
        exigirEstadoPrestamo(reserva, EstadoPrestamo.PENDIENTE, "marcar como no reclamada");

        OffsetDateTime ahora = OffsetDateTime.now(Reserva.ZONA);
        OffsetDateTime limite = reserva.getFechaHoraInicio()
                .plus(reservasProperties.prestamo().margenNoReclamado());
        if (ahora.isBefore(limite)) {
            throw new ValidacionException(
                    "Aun no se puede declarar no reclamada: hay margen hasta las "
                            + limite.format(HORA));
        }

        reserva.setEstadoPrestamo(EstadoPrestamo.NO_RECLAMADO);
        // Cancelling frees the window for someone else — an unclaimed booking
        // should not keep blocking the equipment for the rest of its slot.
        reserva.setEstado(EstadoReserva.CANCELADA);
        reserva.setFechaCancelacion(LocalDateTime.now());
        acumularObservacion(reserva, request == null ? null : request.observaciones());

        Reserva guardada = reservaRepository.save(reserva);

        if (request != null && request.sancionar()) {
            sancionService.sancionarPorNoReclamar(
                    guardada.getUsuario(), guardada,
                    reservasProperties.sanciones().diasPorNoReclamar());
        }

        return reservaMapper.toResponse(guardada);
    }

    // --- helpers -----------------------------------------------------------

    private Reserva cargar(Long idReserva) {
        return reservaRepository.findById(idReserva)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Reserva no encontrada: " + idReserva));
    }

    /**
     * Guard every transition against the current loan state, naming both the
     * attempted action and the state that blocked it — "no se puede entregar
     * (estado actual: DEVUELTO)" tells the auxiliar what happened; a bare
     * "invalid state" does not.
     */
    private void exigirEstadoPrestamo(Reserva reserva, EstadoPrestamo esperado, String accion) {
        if (reserva.getEstadoPrestamo() != esperado) {
            throw new ValidacionException(
                    "No se puede " + accion + ": el prestamo esta en estado "
                            + reserva.getEstadoPrestamo() + " y se requiere " + esperado);
        }
    }

    /**
     * Append rather than overwrite: the hand-over note and the return note
     * are both part of the record, and the second must not erase the first.
     */
    private void acumularObservacion(Reserva reserva, String nueva) {
        if (nueva == null || nueva.isBlank()) {
            return;
        }
        String previa = reserva.getObservacionesPrestamo();
        String combinada = (previa == null || previa.isBlank())
                ? nueva.trim()
                : previa + " | " + nueva.trim();
        // The column holds 500 chars; keep the most recent note when it overflows.
        reserva.setObservacionesPrestamo(
                combinada.length() <= 500 ? combinada : combinada.substring(combinada.length() - 500));
    }

    /**
     * The auxiliar performing the action, resolved from the token. Never
     * from the request body — attribution a client can choose is not
     * attribution.
     */
    private Usuario auxiliarActual() {
        return currentUser.correoOptional()
                .map(correo -> {
                    try {
                        return usuarioService.findEntityByCorreo(correo);
                    } catch (RecursoNoEncontradoException e) {
                        return null;
                    }
                })
                .orElse(null);
    }

    private EstadoPrestamo parseEstadoPrestamo(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return EstadoPrestamo.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ValidacionException("estadoPrestamo invalido: " + raw);
        }
    }

    private static OffsetDateTime inicioDelDia(LocalDate dia) {
        return dia.atStartOfDay().atOffset(Reserva.ZONA);
    }
}
