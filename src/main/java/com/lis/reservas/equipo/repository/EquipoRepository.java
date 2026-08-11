package com.lis.reservas.equipo.repository;

import com.lis.reservas.equipo.entity.Equipo;
import com.lis.reservas.equipo.entity.EstadoEquipo;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for {@link Equipo}. Supports paginated filtering by categoria,
 * estado and free-text nombre search. The Specification executor enables
 * dynamic AND-combined filters built in {@code EquipoService}.
 */
@Repository
public interface EquipoRepository
        extends JpaRepository<Equipo, Integer>, JpaSpecificationExecutor<Equipo> {

    List<Equipo> findByCategoria_IdCategoria(Integer idCategoria);

    List<Equipo> findByEstado(EstadoEquipo estado);

    long countByEstado(EstadoEquipo estado);

    /**
     * Pessimistic-write (FOR UPDATE) lookup of a single equipo by id. Used by
     * {@code ReservaService#create} as the serialization point for concurrent
     * reservation creators targeting the same equipo: both threads contend on
     * this single row lock, so the second thread's conflict query runs only
     * after the first thread's INSERT has committed.
     *
     * <p>Without this lock, the {@code findConflictingForUpdate} on an empty
     * reservas set acquires only gap locks, and concurrent INSERTs into the
     * same gap deadlock under REPEATABLE READ. Locking the parent row avoids
     * the cycle because it is a single lock, not a lock graph with a cycle.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Equipo e WHERE e.idEquipo = :id")
    Optional<Equipo> findForUpdate(@Param("id") Integer id);

    /**
     * Paginated search across nombre (case-insensitive LIKE) and optional
     * categoria/estado filters. Null parameters are excluded so the query
     * degrades to broader matches, letting the service layer compose filters.
     */
    @Query("""
            SELECT e FROM Equipo e
            WHERE (:idCategoria IS NULL OR e.categoria.idCategoria = :idCategoria)
              AND (:estado IS NULL OR e.estado = :estado)
              AND (:nombre IS NULL OR LOWER(e.nombre) LIKE LOWER(CONCAT('%', :nombre, '%')))
            """)
    Page<Equipo> search(@Param("idCategoria") Integer idCategoria,
                        @Param("estado") EstadoEquipo estado,
                        @Param("nombre") String nombre,
                        Pageable pageable);
}
