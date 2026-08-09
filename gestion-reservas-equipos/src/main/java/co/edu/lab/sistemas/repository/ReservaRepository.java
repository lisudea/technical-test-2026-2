package co.edu.lab.sistemas.repository;

import co.edu.lab.sistemas.enums.EstadoReserva;
import co.edu.lab.sistemas.model.Reserva;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

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

	boolean existsByEquipoId(Long equipoId);

	boolean existsByEquipoIdAndEstadoReserva(Long equipoId, EstadoReserva estadoReserva);

		@Query("""
						select e.id, e.nombre, count(r)
						from Reserva r
						join r.equipo e
						where (:desde is null or r.fechaHoraInicio >= :desde)
							and (:hasta is null or r.fechaHoraInicio <= :hasta)
						group by e.id, e.nombre
						order by count(r) desc
						""")
		List<Object[]> findTopEquiposHistoricos(
						@Param("desde") LocalDateTime desde,
						@Param("hasta") LocalDateTime hasta,
						Pageable pageable
		);

		@Query(value = """
				select e.id, e.nombre, count(r.id) as total
				from reserva r
				join equipo e on r.equipo_id = e.id
				where (cast(:desde as timestamp) is null or r.fecha_hora_inicio >= cast(:desde as timestamp))
				  and (cast(:hasta as timestamp) is null or r.fecha_hora_inicio <= cast(:hasta as timestamp))
				group by e.id, e.nombre
				order by total desc
				limit :lim
			""", nativeQuery = true)
		List<Object[]> findTopEquiposHistoricosNative(
				@Param("desde") LocalDateTime desde,
				@Param("hasta") LocalDateTime hasta,
				@Param("lim") int lim
		);
}