package com.lis.reservas.equipo.repository;

import com.lis.reservas.equipo.entity.Equipo;
import com.lis.reservas.equipo.entity.EstadoEquipo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

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
