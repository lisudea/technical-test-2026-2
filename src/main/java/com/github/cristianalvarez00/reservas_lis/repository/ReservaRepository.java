package com.github.cristianalvarez00.reservas_lis.repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.github.cristianalvarez00.reservas_lis.model.Reserva;
import org.springframework.data.domain.Pageable;
import com.github.cristianalvarez00.reservas_lis.dto.EstadisticaEquipoResponse;

import java.time.LocalDateTime;
import java.util.List;

/*
REPOSITORIO DE RESERVAS:
Además de las operaciones normales, aquí están las consultas necesarias
para buscar reservas por estudiante, detectar traslapes y calcular el Top 5.
*/
@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Long>{
    // Busca todas las reservas asociadas a un estudiante.
    List<Reserva> findByEstudianteId(Long estudianteId);

    /*
    CONSULTA DE TRASLAPES:
    Existe conflicto cuando una reserva comienza antes de que termine la nueva
    y al mismo tiempo termina después de que inicia la nueva.
    */
    @Query("""
            SELECT COUNT(reserva) > 0 FROM Reserva reserva
            WHERE reserva.equipo.id = :equipoId
            AND reserva.fechaInicio < :fechaFin
            AND reserva.fechaFin > :fechaInicio
    """)
    boolean existeTraslapeHorario(@Param("equipoId") Long equipoId,
                                  @Param("fechaInicio") LocalDateTime fechaInicio,
                                  @Param("fechaFin") LocalDateTime fechaFin);

    /*
    CONSULTA TOP 5:
    Agrupa las reservas por equipo, cuenta cuántas tiene cada uno y las ordena
    de mayor a menor. El limite de 5 se manda desde el servicio con Pageable.
    */
    @Query("""
        SELECT new com.github.cristianalvarez00.reservas_lis.dto.EstadisticaEquipoResponse(
            reserva.equipo.id,
            reserva.equipo.nombre,
            COUNT(reserva)
        )
        FROM Reserva reserva
        GROUP BY reserva.equipo.id, reserva.equipo.nombre
        ORDER BY COUNT(reserva) DESC
    """)
    List<EstadisticaEquipoResponse> obtenerTopEquipos(Pageable pageable);
}
