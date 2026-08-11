package com.lis.reservas.admin.service;

import com.lis.reservas.admin.dto.CambiarRolRequest;
import com.lis.reservas.admin.dto.ResumenAdminResponse;
import com.lis.reservas.auth.CurrentUser;
import com.lis.reservas.common.dto.PagedResponse;
import com.lis.reservas.common.exception.ValidacionException;
import com.lis.reservas.equipo.entity.EstadoEquipo;
import com.lis.reservas.equipo.repository.EquipoRepository;
import com.lis.reservas.reserva.entity.EstadoPrestamo;
import com.lis.reservas.reserva.entity.EstadoReserva;
import com.lis.reservas.reserva.entity.Reserva;
import com.lis.reservas.reserva.repository.ReservaRepository;
import com.lis.reservas.sancion.service.SancionService;
import com.lis.reservas.usuario.dto.UsuarioResponse;
import com.lis.reservas.usuario.entity.Rol;
import com.lis.reservas.usuario.repository.UsuarioRepository;
import com.lis.reservas.usuario.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * The administrator's console: people and the health of the lab.
 *
 * <p>Catalog CRUD already lives in {@code EquipoService} and is simply
 * ADMIN-gated at the security layer — duplicating it here would create two
 * places where an equipment write could diverge. What this service adds is
 * what only an administrator does: assigning roles, and reading the
 * cross-domain summary.
 */
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UsuarioService usuarioService;
    private final UsuarioRepository usuarioRepository;
    private final EquipoRepository equipoRepository;
    private final ReservaRepository reservaRepository;
    private final SancionService sancionService;
    private final CurrentUser currentUser;

    /** Paginated user listing with optional role and text filters. */
    @Transactional(readOnly = true)
    public PagedResponse<UsuarioResponse> listarUsuarios(String rol, String buscar,
                                                         Pageable pageable) {
        Rol filtro = (rol == null || rol.isBlank()) ? null : parseRol(rol);
        return usuarioService.buscar(filtro, buscar, pageable);
    }

    /**
     * Assign a role.
     *
     * <p>Demoting the last remaining ADMIN is refused: it would lock the
     * whole console out with no way back in short of manual SQL against
     * production. {@code UsuarioService} separately refuses self-demotion,
     * which covers the common accident; this covers the case where two
     * admins demote each other down to zero.
     */
    @Transactional
    public UsuarioResponse cambiarRol(Integer idUsuario, CambiarRolRequest request) {
        var actual = usuarioService.findById(idUsuario);
        boolean quitaUnAdmin = actual.getRol() == Rol.ADMIN && request.rol() != Rol.ADMIN;

        if (quitaUnAdmin && usuarioRepository.countByRol(Rol.ADMIN) <= 1) {
            throw new ValidacionException(
                    "No se puede quitar el rol al unico ADMIN del sistema. "
                            + "Promueva a otro administrador primero.");
        }

        return usuarioService.cambiarRol(idUsuario, request.rol(), currentUser.correo());
    }

    /** Cross-domain snapshot for the admin dashboard. */
    @Transactional(readOnly = true)
    public ResumenAdminResponse resumen() {
        OffsetDateTime ahora = OffsetDateTime.now(Reserva.ZONA);
        LocalDate hoy = LocalDate.now(Reserva.ZONA);
        OffsetDateTime inicioHoy = hoy.atStartOfDay().atOffset(Reserva.ZONA);
        OffsetDateTime inicioManana = hoy.plusDays(1).atStartOfDay().atOffset(Reserva.ZONA);

        return new ResumenAdminResponse(
                equipoRepository.count(),
                equipoRepository.countByEstado(EstadoEquipo.DISPONIBLE),
                equipoRepository.countByEstado(EstadoEquipo.MANTENIMIENTO),
                equipoRepository.countByEstado(EstadoEquipo.BAJA),
                reservaRepository.countByEstado(EstadoReserva.ACTIVA),
                reservaRepository.contarEnCurso(ahora),
                reservaRepository.contarPorEstadoPrestamoEnDia(
                        inicioHoy, inicioManana, EstadoPrestamo.PENDIENTE),
                reservaRepository.contarVencidos(ahora),
                sancionService.contarVigentes(),
                usuarioRepository.count(),
                usuarioRepository.countByRol(Rol.AUXILIAR),
                usuarioRepository.countByRol(Rol.ADMIN));
    }

    private Rol parseRol(String raw) {
        try {
            return Rol.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ValidacionException("Rol invalido: " + raw);
        }
    }
}
