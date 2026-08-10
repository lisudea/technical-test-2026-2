package com.lis.backend.repository;

import com.lis.backend.entity.CategoriaEquipo;
import com.lis.backend.entity.Equipo;
import com.lis.backend.entity.EstadoEquipo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface EquipoRepository extends JpaRepository<Equipo, Long> {

    boolean existsByCodigoIgnoreCase(String codigo);

    boolean existsByNumeroSerieIgnoreCase(String numeroSerie);

    @Query("""
        SELECT e FROM Equipo e
        WHERE (:search IS NULL OR :search = ''
                OR LOWER(e.nombre) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(e.numeroSerie) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(e.codigo) LIKE LOWER(CONCAT('%', :search, '%')))
            AND (:categoria IS NULL OR e.categoria = :categoria)
            AND (
                :estado IS NULL
                OR (:estado = com.lis.backend.entity.EstadoEquipo.EN_MANTENIMIENTO
                    AND e.estado = com.lis.backend.entity.EstadoEquipo.EN_MANTENIMIENTO)
                OR (:estado = com.lis.backend.entity.EstadoEquipo.RESERVADO
                    AND e.estado <> com.lis.backend.entity.EstadoEquipo.EN_MANTENIMIENTO
                    AND EXISTS (
                        SELECT r.id FROM Reserva r
                        WHERE r.equipo.id = e.id
                        AND r.estado = com.lis.backend.entity.EstadoReserva.ACTIVA
                        AND r.fechaInicio <= :ahora
                        AND r.fechaFin > :ahora
                    ))
                OR (:estado = com.lis.backend.entity.EstadoEquipo.DISPONIBLE
                    AND e.estado = com.lis.backend.entity.EstadoEquipo.DISPONIBLE
                    AND NOT EXISTS (
                        SELECT r.id FROM Reserva r
                        WHERE r.equipo.id = e.id
                        AND r.estado = com.lis.backend.entity.EstadoReserva.ACTIVA
                        AND r.fechaInicio <= :ahora
                        AND r.fechaFin > :ahora
                    ))
            )
        """)
    Page<Equipo> buscar(
            @Param("search") String search,
            @Param("categoria") CategoriaEquipo categoria,
            @Param("estado") EstadoEquipo estado,
            @Param("ahora") LocalDateTime ahora,
            Pageable pageable
    );

    @Query("SELECT COUNT(e) FROM Equipo e WHERE e.estado = :estado")
    long countByEstado(@Param("estado") EstadoEquipo estado);

    @Query("SELECT COUNT(e) FROM Equipo e WHERE e.categoria = :categoria")
    long countByCategoria(@Param("categoria") CategoriaEquipo categoria);
}
