package udea.lis.equipos_reservas_api.repository;

// Importamos las clases necesarias para trabajar con la entidad Reserva.
import udea.lis.equipos_reservas_api.model.EstadoReserva;
import udea.lis.equipos_reservas_api.model.Reserva;

// Importamos las clases necesarias para trabajar con JPA y consultas personalizadas.
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

// Esta interfaz es un repositorio de Spring Data JPA para la entidad Reserva.
// Extiende JpaRepository, lo que le proporciona métodos CRUD y de paginación por defecto.
// El <Long> hace referencia al tipo de dato del id de la entidad Reserva, que es Long.
public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    // Este método busca reservas activas que se solapen en fechas con una nueva reserva solicitada.
    // Se utiliza para validar conflictos de disponibilidad de un equipo. La validación se hace con los
    // atributos fechaReserva y fechaDevolucion de la entidad Reserva.
    @Query("SELECT r FROM Reserva r WHERE r.equipo.id = :equipoId " +
           "AND r.estado = 'ACTIVA' " +
           "AND r.fechaReserva < :fechaFin AND r.fechaDevolucion > :fechaInicio")
    // @Param se utiliza para mapear los parámetros de la consulta con los parámetros del 
    // método. Se guarda el id del equipo y las fechas de inicio y fin de la nueva reserva solicitada para verificar si hay 
    // conflictos.
    List<Reserva> findConflictos(
        @Param("equipoId") Long equipoId,
        @Param("fechaInicio") LocalDateTime fechaInicio,
        @Param("fechaFin") LocalDateTime fechaFin
    );

    // Este método lista las reservas asociadas a un equipo específico.
    List<Reserva> findByEquipoId(Long equipoId);

    // Este método lista de forma paginada las reservas asociadas a un equipo específico.
    Page<Reserva> findByEquipoId(Long equipoId, Pageable pageable);

    // Este método lista de forma paginada las reservas con un estado específico.
    Page<Reserva> findByEstado(EstadoReserva estado, Pageable pageable);

    // Este método lista de forma paginada las reservas de un equipo con un estado específico.
    Page<Reserva> findByEquipoIdAndEstado(Long equipoId, EstadoReserva estado, Pageable pageable);

    // Este método consulta los equipos más solicitados para generar estadísticas y los resultados se ordenan de mayor 
    // a menor según la cantidad de reservas activas (las canceladas no se cuentan). El límite de resultados se controla
    // con el Pageable. Se guarda el id del equipo y la cantidad de reservas asociadas a ese equipo en un arreglo de objetos.
    @Query("SELECT r.equipo.id, COUNT(r) as total FROM Reserva r " +
           "WHERE r.estado = 'ACTIVA' " +
           "GROUP BY r.equipo.id ORDER BY total DESC")
    List<Object[]> findEquiposMasSolicitados(Pageable pageable);
}