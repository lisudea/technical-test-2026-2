package com.lis.backend.repository;

import com.lis.backend.entity.EstadoReserva;
import com.lis.backend.entity.Reserva;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    @Query("""
        SELECT COUNT(r) FROM Reserva r
        WHERE r.equipo.id = :equipoId
            AND r.estado = com.lis.backend.entity.EstadoReserva.ACTIVA
            AND r.fechaInicio < :fechaFin
            AND r.fechaFin > :fechaInicio
        """)
    long contarConflictos(
            @Param("equipoId") Long equipoId,
            @Param("fechaInicio") LocalDateTime fechaInicio,
            @Param("fechaFin") LocalDateTime fechaFin
    );

    @Query("""
        SELECT r FROM Reserva r
        WHERE (:estado IS NULL OR r.estado = :estado)
            AND (:equipoId IS NULL OR r.equipo.id = :equipoId)
            AND LOWER(r.correoUsuario) = LOWER(COALESCE(:correo, r.correoUsuario))
        ORDER BY r.fechaInicio DESC
        """)
    Page<Reserva> buscar(
            @Param("estado") EstadoReserva estado,
            @Param("equipoId") Long equipoId,
            @Param("correo") String correo,
            Pageable pageable
    );

    List<Reserva> findByEquipoIdOrderByFechaInicioDesc(Long equipoId);

    long countByEstado(EstadoReserva estado);

    long countByEquipoId(Long equipoId);

    @Query("""
        SELECT r.equipo.id, COUNT(r)
        FROM Reserva r
        GROUP BY r.equipo.id
        ORDER BY COUNT(r) DESC
        """)
    List<Object[]> topEquipos(Pageable pageable);

    @Query("""
        SELECT COUNT(r)
        FROM Reserva r
        WHERE r.equipo.id = :equipoId
            AND r.estado = com.lis.backend.entity.EstadoReserva.ACTIVA
            AND r.fechaInicio <= :ahora
            AND r.fechaFin > :ahora
        """)
    long contarReservaVigente(
            @Param("equipoId") Long equipoId,
            @Param("ahora") LocalDateTime ahora
    );
}
