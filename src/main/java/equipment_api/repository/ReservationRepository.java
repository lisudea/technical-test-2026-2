package equipment_api.repository;

import equipment_api.entity.Reservation;
import equipment_api.entity.ReservationStatus;
import equipment_api.dto.TopEquipmentResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.time.LocalDateTime;
import org.springframework.data.domain.Pageable;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    /**
     * REGLA DE NEGOCIO CRITICA: dos reservas del mismo equipo se solapan si y
     * solo si  A.inicio < B.fin  Y  A.fin > B.inicio.
     *
     * Se tratan como intervalos semiabiertos [inicio, fin), de modo que dos
     * reservas contiguas NO son conflicto:
     *
     *   10:00-11:00 y 11:00-12:00  -> OK   (se tocan, no se solapan)
     *   10:00-11:00 y 10:30-11:30  -> 409  (se cruzan)
     *
     * Solo cuentan las reservas ACTIVE: una reserva cancelada libera la franja.
     */
    @Query("""
        SELECT COUNT(r) > 0
        FROM Reservation r
        WHERE r.equipment.id = :equipmentId
        AND r.status = equipment_api.entity.ReservationStatus.ACTIVE
        AND r.startTime < :endTime
        AND r.endTime > :startTime
    """)
    boolean existsOverlappingReservation(
            @Param("equipmentId") Long equipmentId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    List<Reservation> findByEquipmentId(Long equipmentId);

    List<Reservation> findAllByOrderByStartTimeDesc();

    long countByEquipmentIdAndStatus(Long equipmentId, ReservationStatus status);

    /**
     * Top de equipos mas solicitados HISTORICAMENTE: cuenta todas las reservas,
     * incluidas las canceladas, porque el enunciado pide el historico de
     * solicitudes y no el de reservas vigentes.
     */
    @Query("""
        SELECT new equipment_api.dto.TopEquipmentResponse(
            r.equipment.id,
            r.equipment.name,
            COUNT(r.id)
        )
        FROM Reservation r
        GROUP BY r.equipment.id, r.equipment.name
        ORDER BY COUNT(r.id) DESC
    """)
    List<TopEquipmentResponse> findTopEquipment(Pageable pageable);

    /**
     * Rellena el estado de las reservas creadas antes de introducir el campo
     * `status` (ver Reservation: la columna es anulable para no romper
     * ddl-auto=update sobre tablas con datos previos).
     */
    @Modifying
    @Query("UPDATE Reservation r SET r.status = equipment_api.entity.ReservationStatus.ACTIVE WHERE r.status IS NULL")
    int backfillNullStatus();
}