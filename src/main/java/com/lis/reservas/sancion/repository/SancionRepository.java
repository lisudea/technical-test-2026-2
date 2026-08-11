package com.lis.reservas.sancion.repository;

import com.lis.reservas.sancion.entity.EstadoSancion;
import com.lis.reservas.sancion.entity.Sancion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for {@link Sancion}.
 *
 * <p>Every "in force" query spells out the same predicate —
 * {@code estado = ACTIVA AND fechaFin > :ahora} — because expiry is derived
 * from the date, never stored. The {@code idx_sanciones_vigencia} index
 * matches that predicate's column order, which matters: the check runs on
 * every single reservation attempt.
 *
 * <p>{@code :ahora} is a parameter rather than {@code CURRENT_TIMESTAMP} so
 * tests can pin the clock instead of sleeping.
 */
@Repository
public interface SancionRepository extends JpaRepository<Sancion, Long> {

    /** Cheap guard used on the reservation hot path. */
    @Query("""
            SELECT COUNT(s) > 0 FROM Sancion s
            WHERE s.usuario.idUsuario = :idUsuario
              AND s.estado = com.lis.reservas.sancion.entity.EstadoSancion.ACTIVA
              AND s.fechaFin > :ahora
            """)
    boolean existsVigenteByUsuario(@Param("idUsuario") Integer idUsuario,
                                   @Param("ahora") LocalDateTime ahora);

    /**
     * Sanctions currently in force for a user, latest-expiring first, so the
     * rejection message can name the actual reason and end date.
     *
     * <p>Returns a list rather than an {@code Optional} via a {@code default}
     * helper on purpose: a default method on a repository interface is mocked
     * like any other in unit tests, so it would silently return {@code null}
     * instead of delegating to the query — a trap that costs an afternoon.
     * Callers take {@code .stream().findFirst()} themselves.
     */
    @Query("""
            SELECT s FROM Sancion s
            WHERE s.usuario.idUsuario = :idUsuario
              AND s.estado = com.lis.reservas.sancion.entity.EstadoSancion.ACTIVA
              AND s.fechaFin > :ahora
            ORDER BY s.fechaFin DESC
            """)
    List<Sancion> findVigentesByUsuario(@Param("idUsuario") Integer idUsuario,
                                        @Param("ahora") LocalDateTime ahora);

    /**
     * Paginated listing for the ADMIN console. All filters are optional and
     * AND-combined.
     *
     * @param idUsuario    restrict to one user; {@code null} = everyone.
     * @param estado       exact lifecycle state; {@code null} = any.
     * @param soloVigentes when true, keep only sanctions in force at
     *                     {@code ahora} (which also implies ACTIVA).
     */
    @Query("""
            SELECT s FROM Sancion s
            WHERE (:idUsuario IS NULL OR s.usuario.idUsuario = :idUsuario)
              AND (:estado IS NULL OR s.estado = :estado)
              AND (:soloVigentes = FALSE
                   OR (s.estado = com.lis.reservas.sancion.entity.EstadoSancion.ACTIVA
                       AND s.fechaFin > :ahora))
            """)
    Page<Sancion> buscar(@Param("idUsuario") Integer idUsuario,
                         @Param("estado") EstadoSancion estado,
                         @Param("soloVigentes") boolean soloVigentes,
                         @Param("ahora") LocalDateTime ahora,
                         Pageable pageable);

    Page<Sancion> findByUsuarioCorreoOrderByFechaCreacionDesc(String correo, Pageable pageable);

    @Query("""
            SELECT COUNT(s) FROM Sancion s
            WHERE s.estado = com.lis.reservas.sancion.entity.EstadoSancion.ACTIVA
              AND s.fechaFin > :ahora
            """)
    long countVigentes(@Param("ahora") LocalDateTime ahora);
}
