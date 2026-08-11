package com.lis.reservas.usuario.repository;

import com.lis.reservas.usuario.entity.Rol;
import com.lis.reservas.usuario.entity.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
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

    List<Usuario> findByRol(Rol rol);

    long countByRol(Rol rol);

    /**
     * Paginated listing for the ADMIN console. Both filters are optional and
     * AND-combined; a {@code null} parameter is dropped from the predicate so
     * the query degrades to broader matches.
     *
     * @param rol    exact role filter; {@code null} = every role.
     * @param buscar case-insensitive fragment matched against nombre OR
     *               correo; {@code null} = no text filter.
     */
    @Query("""
            SELECT u FROM Usuario u
            WHERE (:rol IS NULL OR u.rol = :rol)
              AND (:buscar IS NULL
                   OR LOWER(u.nombre) LIKE LOWER(CONCAT('%', :buscar, '%'))
                   OR LOWER(u.correo) LIKE LOWER(CONCAT('%', :buscar, '%')))
            """)
    Page<Usuario> buscar(@Param("rol") Rol rol,
                         @Param("buscar") String buscar,
                         Pageable pageable);
}
