package com.udea.labreservas.repository;

import com.udea.labreservas.entity.Reservation;
import com.udea.labreservas.entity.ReservationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Integer> {

    @Query("""
            SELECT COUNT(r) FROM Reservation r
            WHERE r.equipment.equipmentId = :equipmentId
              AND r.startTime < :endTime
              AND r.endTime > :startTime
              AND r.status = :status
              AND (:excludeReservationId IS NULL OR r.reservationId <> :excludeReservationId)
            """)
    long countOverlapping(@Param("equipmentId") Integer equipmentId,
                          @Param("startTime") LocalDateTime startTime,
                          @Param("endTime") LocalDateTime endTime,
                          @Param("status") ReservationStatus status,
                          @Param("excludeReservationId") Integer excludeReservationId);

    @Query("SELECT COUNT(r) FROM Reservation r " +
            "WHERE r.equipment.equipmentId = :equipmentId AND r.status = :status")
    long countActiveByEquipment(@Param("equipmentId") Integer equipmentId,
                                @Param("status") ReservationStatus status);

    @Query("SELECT r FROM Reservation r WHERE r.user.userId = :userId")
    Page<Reservation> findByUserId(@Param("userId") Integer userId, Pageable pageable);

    List<Reservation> findByStatusAndEndTimeLessThanEqual(ReservationStatus status, LocalDateTime endTime);
}