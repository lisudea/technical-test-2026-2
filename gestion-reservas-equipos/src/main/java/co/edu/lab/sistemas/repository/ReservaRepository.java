package co.edu.lab.sistemas.repository;

import co.edu.lab.sistemas.enums.EstadoReserva;
import co.edu.lab.sistemas.model.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

// CRUD basico para las reservas de uso de equipos.
public interface ReservaRepository extends JpaRepository<Reserva, Long>, JpaSpecificationExecutor<Reserva> {

    @Query("""
	    select case when count(r) > 0 then true else false end
	    from Reserva r
	    where r.equipo.id = :equipoId
	      and r.estadoReserva = :estadoReserva
	      and :nuevaInicio < r.fechaHoraFin
	      and :nuevaFin > r.fechaHoraInicio
	    """)
    boolean existsActivaSolapada(
	    @Param("equipoId") Long equipoId,
	    @Param("estadoReserva") EstadoReserva estadoReserva,
	    @Param("nuevaInicio") LocalDateTime nuevaInicio,
	    @Param("nuevaFin") LocalDateTime nuevaFin
    );
}