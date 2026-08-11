package com.lis.reservas.reserva.service;

import com.lis.reservas.auth.CurrentUser;
import com.lis.reservas.common.dto.PagedResponse;
import com.lis.reservas.common.exception.EquipoNoDisponibleException;
import com.lis.reservas.common.exception.RecursoNoEncontradoException;
import com.lis.reservas.common.exception.ReservaEnConflictoException;
import com.lis.reservas.common.exception.ValidacionException;
import com.lis.reservas.config.ReservasProperties;
import com.lis.reservas.equipo.entity.Equipo;
import com.lis.reservas.equipo.entity.EstadoEquipo;
import com.lis.reservas.equipo.repository.EquipoRepository;
import com.lis.reservas.reserva.dto.ReservaCreateRequest;
import com.lis.reservas.reserva.dto.ReservaResponse;
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

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Application service for {@link Reserva} — the heart of the system.
 *
 * <p>Reservation creation is the single most concurrency-sensitive operation:
 * two users may try to book the same equipo for overlapping windows at the
 * same time. MySQL 8 has no exclusion constraint, so the no-overlap rule is
 * enforced here, inside a {@link Transactional} method, in three ordered
 * stages:
 *
 * <ol>
 *   <li><b>Pre-validate</b> — fail fast on cheap, equipo-local invariants
 *       (start &lt; end, not in the past, within the max duration, equipo
 *       {@code disponible}) <em>before</em> acquiring any row lock, so we
 *       never hold a {@code FOR UPDATE} lock on work that will be rejected.</li>
 *   <li><b>Lock + detect</b> — call
 *       {@code ReservaRepository#findConflictingForUpdate}, which emits a
 *       {@code SELECT ... FOR UPDATE} over the equipo's active reservas.
 *       Concurrent creators targeting the same equipo serialize on those
 *       rows; the {@code idx_reservas_conflicto} index keeps the scan cheap.</li>
 *   <li><b>Persist</b> — if no conflict was found, save the new reserva with
 *       {@code estado = ACTIVA}. The transaction commits the lock release
 *       together with the insert, so the window can only be double-booked by
 *       a bug, not by a race.</li>
 * </ol>
 *
 * <p>Cancellation is a soft delete ({@code estado = CANCELADA}): the row is
 * kept for audit trails and honest statistics, and is excluded from future
 * overlap checks (the conflict query filters {@code estado = ACTIVA}).
 *
 * <h2>Who may see and touch what</h2>
 *
 * <p>Reservations carry other people's names, emails and usage patterns, so
 * the row-level rules live here rather than in {@code SecurityConfig} — a
 * URL pattern cannot express "only your own rows":
 *
 * <ul>
 *   <li>An ESTUDIANTE books only for themselves (the body's correo is
 *       overridden by the token's principal), lists only their own
 *       reservations, and can read or cancel only their own.</li>
 *   <li>AUXILIAR and ADMIN see everything and may book on behalf of a user
 *       standing at the counter.</li>
 *   <li>A sanctioned user cannot create reservations at all.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final EquipoRepository equipoRepository;
    private final UsuarioService usuarioService;
    private final ReservaMapper reservaMapper;
    private final ReservasProperties reservasProperties;
    private final SancionService sancionService;
    private final CurrentUser currentUser;

    /**
     * Create a reservation after pre-validation, pessimistic locking and
     * conflict detection.
     *
     * @throws RecursoNoEncontradoException    if the equipo does not exist.
     * @throws ValidacionException              if the time window is invalid
     *         (start &gt;= end, in the past, or exceeds the max duration).
     * @throws EquipoNoDisponibleException       if the equipo is not in the
     *         {@code DISPONIBLE} state.
     * @throws ReservaEnConflictoException     if an active reservation
     *         overlaps the requested window.
     */
    @Transactional
    public ReservaResponse create(ReservaCreateRequest request) {
        // --- 1. Resolve equipo -------------------------------------------------
        Equipo equipo = equipoRepository.findById(request.idEquipo())
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Equipo no encontrado: " + request.idEquipo()));

        OffsetDateTime inicio = request.fechaHoraInicio();
        OffsetDateTime fin = request.fechaHoraFin();

        // --- 2. Pre-validate (no lock held yet) -------------------------------
        preValidateWindow(equipo, inicio, fin);

        // --- 3. Resolve the reserving usuario ---------------------------------
        // A student may only book for themselves: the body's correo is
        // client-controlled, so for a non-staff caller it is replaced by the
        // token's principal. Otherwise anyone could burn someone else's quota
        // or book around their own sanction using a colleague's address.
        Usuario usuario = resolverTitular(request);

        // --- 3b. A sanctioned user cannot book --------------------------------
        sancionService.verificarPuedeReservar(usuario);

        // --- 4. Serialize on the equipo row (FOR UPDATE) ---------------------
        // Locking the parent equipo serializes concurrent creators targeting
        // the same equipo on a single row, avoiding the gap-lock deadlock
        // that findConflictingForUpdate alone would cause when the reservas
        // table is empty for this equipo.
        equipoRepository.findForUpdate(equipo.getIdEquipo());

        // --- 5. Acquire FOR UPDATE lock and detect conflicts ------------------
        List<Reserva> conflicts = reservaRepository.findConflictingForUpdate(
                equipo.getIdEquipo(), inicio, fin);
        if (!conflicts.isEmpty()) {
            throw new ReservaEnConflictoException(
                    "Reserva en conflicto: el equipo ya esta reservado en ese horario");
        }

        // --- 6. Persist the active reservation --------------------------------
        Reserva reserva = Reserva.builder()
                .equipo(equipo)
                .usuario(usuario)
                .fechaHoraInicio(inicio)
                .fechaHoraFin(fin)
                .estado(EstadoReserva.ACTIVA)
                .motivo(request.motivo())
                .build();

        Reserva saved = reservaRepository.save(reserva);
        return reservaMapper.toResponse(saved);
    }

    /**
     * Cancel a reservation (soft delete). Only the {@code estado} and
     * {@code fechaCancelacion} change; the row is retained for history.
     *
     * @throws RecursoNoEncontradoException if the reserva does not exist.
     */
    @Transactional
    public ReservaResponse cancel(Long id) {
        Reserva reserva = reservaRepository.findById(id)
                .filter(this::esVisiblePorElSolicitante)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Reserva no encontrada: " + id));
        reserva.setEstado(EstadoReserva.CANCELADA);
        reserva.setFechaCancelacion(LocalDateTime.now());
        Reserva saved = reservaRepository.save(reserva);
        return reservaMapper.toResponse(saved);
    }

    /**
     * @throws RecursoNoEncontradoException if the reserva does not exist.
     */
    @Transactional(readOnly = true)
    public ReservaResponse findById(Long id) {
        return reservaRepository.findById(id)
                .filter(this::esVisiblePorElSolicitante)
                .map(reservaMapper::toResponse)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Reserva no encontrada: " + id));
    }

    /**
     * Dynamic, AND-combined listing filter for {@code GET /api/v1/reservas}.
     * Every parameter is optional; {@code null} parameters are dropped so the
     * query degrades to broader matches.
     *
     * @param idEquipo       filter by equipment id; {@code null} = all.
     * @param correoUsuario  filter by reserving user's correo; {@code null} = all.
     * @param desde          keep reservations starting on/after this instant.
     * @param hasta          keep reservations ending on/before this instant.
     * @param estado         {@link EstadoReserva} name filter; blank = all.
     */
    @Transactional(readOnly = true)
    public PagedResponse<ReservaResponse> list(Integer idEquipo, String correoUsuario,
                                               OffsetDateTime desde, OffsetDateTime hasta,
                                               String estado, Pageable pageable) {
        EstadoReserva estadoReserva = (estado == null || estado.isBlank())
                ? null
                : EstadoReserva.valueOf(estado.trim().toUpperCase());

        // A student sees only their own reservations, whatever they ask for.
        // Reservations carry names, emails and usage patterns of other people;
        // the listing is not a directory.
        String correoEfectivo = currentUser.esPersonal()
                ? correoUsuario
                : currentUser.correo();

        Page<Reserva> page = reservaRepository.findByFilters(
                idEquipo, correoEfectivo, desde, hasta, estadoReserva, pageable);
        return PagedResponse.from(page.map(reservaMapper::toResponse));
    }

    /**
     * Resolve who the reservation is for.
     *
     * <p>Loan-desk staff may book on behalf of someone at the counter, so
     * their request body is honoured. Everyone else books for themselves:
     * the body's {@code correoUsuario} is ignored in favour of the token's
     * principal, because the body is client-controlled and the token is not.
     */
    private Usuario resolverTitular(ReservaCreateRequest request) {
        if (currentUser.esPersonal()) {
            return usuarioService.upsertByCorreo(
                    request.correoUsuario(), request.nombreUsuario());
        }
        String correo = currentUser.correo();
        return usuarioService.upsertByCorreo(correo, request.nombreUsuario());
    }

    /**
     * Row-level read rule: staff see every reservation, a student sees only
     * their own.
     *
     * <p>A hidden reservation is reported as 404 rather than 403 on purpose —
     * a 403 would confirm that the id exists, which is exactly the fact being
     * withheld.
     */
    private boolean esVisiblePorElSolicitante(Reserva reserva) {
        if (currentUser.esPersonal()) {
            return true;
        }
        return currentUser.correoOptional()
                .filter(correo -> correo.equalsIgnoreCase(reserva.getUsuario().getCorreo()))
                .isPresent();
    }

    /**
     * Fail fast on equipo-local invariants before any row lock is taken.
     * Throwing here keeps the {@code FOR UPDATE} lock window as short as
     * possible — we never lock rows for work that will be rejected.
     */
    private void preValidateWindow(Equipo equipo, OffsetDateTime inicio, OffsetDateTime fin) {
        if (!inicio.isBefore(fin)) {
            throw new ValidacionException(
                    "fechaHoraInicio debe ser anterior a fechaHoraFin");
        }
        if (inicio.isBefore(OffsetDateTime.now())) {
            throw new ValidacionException(
                    "fechaHoraInicio no puede estar en el pasado");
        }
        Duration duration = Duration.between(inicio, fin);
        if (duration.compareTo(reservasProperties.maxDuration()) > 0) {
            throw new ValidacionException(
                    "La duracion de la reserva supera el maximo permitido ("
                            + reservasProperties.maxDuration().toHours() + "h)");
        }
        if (equipo.getEstado() != EstadoEquipo.DISPONIBLE) {
            throw new EquipoNoDisponibleException(
                    "El equipo no esta disponible para reserva (estado: "
                            + equipo.getEstado() + ")");
        }
    }
}
