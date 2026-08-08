package com.lis.reservas.usuario.repository;

import com.lis.reservas.usuario.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for {@link Usuario}. Lookups are by the natural key {@code correo}
 * (UNIQUE) — used to upsert a user when creating a reservation or validating
 * a Google SSO token.
 */
@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    Optional<Usuario> findByCorreo(String correo);

    boolean existsByCorreo(String correo);
}
