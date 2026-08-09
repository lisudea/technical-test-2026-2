package com.lis.reservas.usuario.service;

import com.lis.reservas.usuario.dto.UsuarioResponse;
import com.lis.reservas.usuario.entity.Usuario;
import com.lis.reservas.usuario.mapper.UsuarioMapper;
import com.lis.reservas.usuario.repository.UsuarioRepository;
import com.lis.reservas.common.exception.RecursoNoEncontradoException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Application service for {@link Usuario}.
 *
 * <p>Users are identified by their UNIQUE {@code correo} (the natural key
 * used by Google SSO). {@link #upsertByCorreo} is the entry point used by
 * {@code ReservaService} when creating a reservation: it returns the
 * existing user if the correo is known, or creates a minimal record
 * otherwise. This keeps reservation creation self-contained — a caller
 * never has to pre-register a user.
 */
@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final UsuarioMapper usuarioMapper;

    /**
     * Return the existing usuario for {@code correo}, or create one with the
     * given {@code nombre}. The correo is the natural key; when Google SSO is
     * enabled the correo arrives verified and validated against the
     * configured allowed domain.
     */
    @Transactional
    public Usuario upsertByCorreo(String correo, String nombre) {
        return usuarioRepository.findByCorreo(correo)
                .orElseGet(() -> usuarioRepository.save(
                        Usuario.builder()
                                .nombre(nombre)
                                .correo(correo)
                                .build()));
    }

    /**
     * @throws RecursoNoEncontradoException if no usuario has that correo.
     */
    public UsuarioResponse findByCorreo(String correo) {
        return usuarioRepository.findByCorreo(correo)
                .map(usuarioMapper::toResponse)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Usuario no encontrado: " + correo));
    }

    /**
     * @throws RecursoNoEncontradoException if no usuario has that id.
     */
    public Usuario findById(Integer id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Usuario no encontrado: " + id));
    }
}
