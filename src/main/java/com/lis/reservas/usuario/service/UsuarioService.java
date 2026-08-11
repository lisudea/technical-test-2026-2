package com.lis.reservas.usuario.service;

import com.lis.reservas.common.dto.PagedResponse;
import com.lis.reservas.common.exception.RecursoNoEncontradoException;
import com.lis.reservas.common.exception.ValidacionException;
import com.lis.reservas.config.ReservasProperties;
import com.lis.reservas.usuario.dto.UsuarioResponse;
import com.lis.reservas.usuario.entity.Rol;
import com.lis.reservas.usuario.entity.Usuario;
import com.lis.reservas.usuario.mapper.UsuarioMapper;
import com.lis.reservas.usuario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Application service for {@link Usuario}.
 *
 * <p>Users are identified by their UNIQUE {@code correo} (the natural key
 * used by Google SSO). {@link #upsertByCorreo} is the entry point used by
 * {@code AuthService} on sign-in and by {@code ReservaService} when creating
 * a reservation: it returns the existing user if the correo is known, or
 * creates a minimal record otherwise. This keeps reservation creation
 * self-contained — a caller never has to pre-register a user.
 *
 * <p>Role handling has one rule worth stating out loud: a new user is always
 * created as {@link Rol#ESTUDIANTE}, and the configured bootstrap lists can
 * only <em>promote</em>, never demote. Removing an email from
 * {@code reservas.auth.roles.admins} therefore does not silently strip a role
 * that an ADMIN granted through the API — demotion is always an explicit
 * {@link #cambiarRol} call, which leaves an audit trail in the response.
 */
@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final UsuarioMapper usuarioMapper;
    private final ReservasProperties reservasProperties;

    /**
     * Return the existing usuario for {@code correo}, or create one with the
     * given {@code nombre}, applying the configured role bootstrap.
     *
     * <p>On an existing user the bootstrap is re-evaluated and applied only
     * when it would raise the role, so an operator can grant the first ADMIN
     * by environment variable without ever touching production SQL.
     */
    @Transactional
    public Usuario upsertByCorreo(String correo, String nombre) {
        Rol bootstrap = reservasProperties.rolBootstrap(correo).orElse(null);

        return usuarioRepository.findByCorreo(correo)
                .map(existing -> promoteIfNeeded(existing, bootstrap))
                .orElseGet(() -> usuarioRepository.save(
                        Usuario.builder()
                                .nombre(nombre)
                                .correo(correo)
                                .rol(bootstrap == null ? Rol.ESTUDIANTE : bootstrap)
                                .build()));
    }

    /**
     * Change a user's role. The only way to demote someone.
     *
     * @throws RecursoNoEncontradoException if no usuario has that id.
     * @throws ValidacionException if an ADMIN tries to drop their own ADMIN
     *         role — that would leave the console unreachable for the very
     *         account performing the change, and possibly the lab with no
     *         administrator at all.
     */
    @Transactional
    public UsuarioResponse cambiarRol(Integer idUsuario, Rol nuevoRol, String correoSolicitante) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Usuario no encontrado: " + idUsuario));

        boolean seAutoDegrada = usuario.getCorreo().equalsIgnoreCase(correoSolicitante)
                && usuario.getRol() == Rol.ADMIN
                && nuevoRol != Rol.ADMIN;
        if (seAutoDegrada) {
            throw new ValidacionException(
                    "Un administrador no puede quitarse a si mismo el rol ADMIN");
        }

        usuario.setRol(nuevoRol);
        return usuarioMapper.toResponse(usuarioRepository.save(usuario));
    }

    /**
     * Paginated user listing for the ADMIN console.
     *
     * @param rol    filter by exact role; {@code null} = every role.
     * @param buscar case-insensitive fragment matched against nombre OR
     *               correo; blank = no text filter.
     */
    @Transactional(readOnly = true)
    public PagedResponse<UsuarioResponse> buscar(Rol rol, String buscar, Pageable pageable) {
        String fragmento = (buscar == null || buscar.isBlank()) ? null : buscar.trim();
        Page<Usuario> page = usuarioRepository.buscar(rol, fragmento, pageable);
        return PagedResponse.from(page.map(usuarioMapper::toResponse));
    }

    /**
     * @throws RecursoNoEncontradoException if no usuario has that correo.
     */
    @Transactional(readOnly = true)
    public UsuarioResponse findByCorreo(String correo) {
        return usuarioMapper.toResponse(findEntityByCorreo(correo));
    }

    /**
     * Managed entity lookup by the natural key. Used by services that need
     * the persistent identity (reservation ownership, sanction targets).
     *
     * @throws RecursoNoEncontradoException if no usuario has that correo.
     */
    @Transactional(readOnly = true)
    public Usuario findEntityByCorreo(String correo) {
        return usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Usuario no encontrado: " + correo));
    }

    /**
     * @throws RecursoNoEncontradoException if no usuario has that id.
     */
    @Transactional(readOnly = true)
    public Usuario findById(Integer id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Usuario no encontrado: " + id));
    }

    /** Apply the configured bootstrap only when it raises the current role. */
    private Usuario promoteIfNeeded(Usuario usuario, Rol bootstrap) {
        if (bootstrap == null || usuario.getRol().atLeast(bootstrap)) {
            return usuario;
        }
        usuario.setRol(bootstrap);
        return usuarioRepository.save(usuario);
    }
}
