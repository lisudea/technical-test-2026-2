package com.udea.lis.repository;

import com.udea.lis.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByEquipmentId(Long equipmentId);

    @Query("""
        SELECT COUNT(r) > 0
        FROM Reservation r
        WHERE r.equipment.id = :equipmentId
          AND r.status = 'ACTIVE'
          AND r.startTime < :newEnd
          AND r.endTime > :newStart
    """)
    boolean existsOverlappingActiveReservation(
            @Param("equipmentId") Long equipmentId,
            @Param("newStart") LocalDateTime newStart,
            @Param("newEnd") LocalDateTime newEnd);

    @Query("""
        SELECT COUNT(r) > 0
        FROM Reservation r
        WHERE r.equipment.id = :equipmentId
          AND r.status = 'ACTIVE'
          AND r.startTime < :newEnd
          AND r.endTime > :newStart
          AND r.id <> :excludeId
    """)
    boolean existsOverlappingActiveReservationExcluding(
            @Param("equipmentId") Long equipmentId,
            @Param("newStart") LocalDateTime newStart,
            @Param("newEnd") LocalDateTime newEnd,
            @Param("excludeId") Long excludeId);
}
