package com.lis.reservas.sancion.service;

import com.lis.reservas.auth.CurrentUser;
import com.lis.reservas.common.dto.PagedResponse;
import com.lis.reservas.common.exception.RecursoNoEncontradoException;
import com.lis.reservas.common.exception.UsuarioSancionadoException;
import com.lis.reservas.common.exception.ValidacionException;
import com.lis.reservas.reserva.entity.Reserva;
import com.lis.reservas.sancion.dto.LevantarSancionRequest;
import com.lis.reservas.sancion.dto.SancionCreateRequest;
import com.lis.reservas.sancion.dto.SancionResponse;
import com.lis.reservas.sancion.entity.EstadoSancion;
import com.lis.reservas.sancion.entity.OrigenSancion;
import com.lis.reservas.sancion.entity.Sancion;
import com.lis.reservas.sancion.mapper.SancionMapper;
import com.lis.reservas.sancion.repository.SancionRepository;
import com.lis.reservas.usuario.entity.Usuario;
import com.lis.reservas.usuario.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Application service for {@link Sancion} — the discipline side of the lab.
 *
 * <p>Two entry points matter beyond plain CRUD:
 *
 * <ul>
 *   <li>{@link #verificarPuedeReservar} is called by {@code ReservaService}
 *       before every reservation. It is the single place that decides
 *       whether a user is currently barred, so the rule cannot drift between
 *       callers.</li>
 *   <li>{@link #sancionarPorNoReclamar} is called by the loan desk when an
 *       auxiliar declares a no-show. It exists so the consequence of not
 *       showing up is automatic and uniform, instead of depending on whether
 *       whoever was on shift remembered to raise a sanction by hand.</li>
 * </ul>
 *
 * <p>Sanctions are never deleted. Lifting one early sets
 * {@link EstadoSancion#LEVANTADA} and records who did it and why, so the
 * history survives.
 */
@Service
@RequiredArgsConstructor
public class SancionService {

    private static final DateTimeFormatter FECHA_LEGIBLE =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final SancionRepository sancionRepository;
    private final UsuarioService usuarioService;
    private final SancionMapper sancionMapper;
    private final CurrentUser currentUser;

    /**
     * Raise a sanction by hand (ADMIN).
     *
     * <p>The window starts now and runs for {@code dias} whole days. Stacking
     * is rejected: a user already barred cannot accumulate a second
     * overlapping sanction, which would make "when am I free again?"
     * ambiguous. Extend the existing one instead.
     *
     * @throws RecursoNoEncontradoException if the target user does not exist.
     * @throws ValidacionException if the user already has a sanction in force.
     */
    @Transactional
    public SancionResponse crear(SancionCreateRequest request) {
        Usuario objetivo = usuarioService.findById(request.idUsuario());
        LocalDateTime ahora = LocalDateTime.now();

        sancionRepository.findVigentesByUsuario(objetivo.getIdUsuario(), ahora)
                .stream().findFirst()
                .ifPresent(existente -> {
                    throw new ValidacionException(
                            "El usuario ya tiene una sancion vigente hasta "
                                    + existente.getFechaFin().format(FECHA_LEGIBLE)
                                    + ". Levantela antes de crear otra.");
                });

        Sancion sancion = Sancion.builder()
                .usuario(objetivo)
                .motivo(request.motivo())
                .fechaInicio(ahora)
                .fechaFin(ahora.plusDays(request.dias()))
                .estado(EstadoSancion.ACTIVA)
                .origen(OrigenSancion.MANUAL)
                .creadaPor(actor())
                .build();

        return sancionMapper.toResponse(sancionRepository.save(sancion));
    }

    /**
     * Raise the automatic sanction that follows an unclaimed reservation.
     *
     * <p>Returns {@code null} when the policy is disabled
     * ({@code dias <= 0}) or the user is already barred — a no-show should
     * not extend an existing sanction behind an administrator's back.
     */
    @Transactional
    public Sancion sancionarPorNoReclamar(Usuario usuario, Reserva reserva, int dias) {
        if (dias <= 0) {
            return null;
        }
        LocalDateTime ahora = LocalDateTime.now();
        if (sancionRepository.existsVigenteByUsuario(usuario.getIdUsuario(), ahora)) {
            return null;
        }

        Sancion sancion = Sancion.builder()
                .usuario(usuario)
                .motivo("No reclamo la reserva #" + reserva.getIdReserva()
                        + " del equipo " + reserva.getEquipo().getNombre())
                .fechaInicio(ahora)
                .fechaFin(ahora.plusDays(dias))
                .estado(EstadoSancion.ACTIVA)
                .origen(OrigenSancion.AUTOMATICA)
                .reserva(reserva)
                .creadaPor(actor())
                .build();

        return sancionRepository.save(sancion);
    }

    /**
     * Lift a sanction early (ADMIN), recording who did it and why.
     *
     * @throws RecursoNoEncontradoException if the sanction does not exist.
     * @throws ValidacionException if it was already lifted.
     */
    @Transactional
    public SancionResponse levantar(Long idSancion, LevantarSancionRequest request) {
        Sancion sancion = sancionRepository.findById(idSancion)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Sancion no encontrada: " + idSancion));

        if (sancion.getEstado() == EstadoSancion.LEVANTADA) {
            throw new ValidacionException("La sancion ya fue levantada");
        }

        sancion.setEstado(EstadoSancion.LEVANTADA);
        sancion.setFechaLevantamiento(LocalDateTime.now());
        sancion.setLevantadaPor(actor());
        sancion.setObservacionLevantamiento(
                request == null ? null : request.observacion());

        return sancionMapper.toResponse(sancionRepository.save(sancion));
    }

    /**
     * The guard called by {@code ReservaService} before creating a
     * reservation.
     *
     * @throws UsuarioSancionadoException when the user is currently barred.
     */
    @Transactional(readOnly = true)
    public void verificarPuedeReservar(Usuario usuario) {
        sancionRepository.findVigentesByUsuario(usuario.getIdUsuario(), LocalDateTime.now())
                .stream().findFirst()
                .ifPresent(sancion -> {
                    throw new UsuarioSancionadoException(
                            "El usuario tiene una sancion vigente hasta "
                                    + sancion.getFechaFin().format(FECHA_LEGIBLE)
                                    + " y no puede crear reservas. Motivo: "
                                    + sancion.getMotivo());
                });
    }

    /** Paginated listing for the ADMIN / AUXILIAR console. */
    @Transactional(readOnly = true)
    public PagedResponse<SancionResponse> buscar(Integer idUsuario, String estado,
                                                 boolean soloVigentes, Pageable pageable) {
        EstadoSancion estadoSancion = (estado == null || estado.isBlank())
                ? null
                : EstadoSancion.valueOf(estado.trim().toUpperCase());

        Page<Sancion> page = sancionRepository.buscar(
                idUsuario, estadoSancion, soloVigentes, LocalDateTime.now(), pageable);
        return PagedResponse.from(page.map(sancionMapper::toResponse));
    }

    /** The authenticated user's own sanction history, newest first. */
    @Transactional(readOnly = true)
    public PagedResponse<SancionResponse> misSanciones(Pageable pageable) {
        Page<Sancion> page = sancionRepository
                .findByUsuarioCorreoOrderByFechaCreacionDesc(currentUser.correo(), pageable);
        return PagedResponse.from(page.map(sancionMapper::toResponse));
    }

    /** Count of sanctions in force, for the ADMIN dashboard. */
    @Transactional(readOnly = true)
    public long contarVigentes() {
        return sancionRepository.countVigentes(LocalDateTime.now());
    }

    /**
     * The acting staff member, resolved from the token.
     *
     * <p>Returns {@code null} rather than failing when the principal has no
     * usuario row: losing the "who did it" attribution is a smaller harm
     * than refusing to record the sanction at all.
     */
    private Usuario actor() {
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
}
