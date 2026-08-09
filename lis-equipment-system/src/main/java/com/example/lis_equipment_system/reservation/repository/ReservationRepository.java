package com.example.lis_equipment_system.reservation.repository;

import com.example.lis_equipment_system.reservation.entity.Reservation;
import com.example.lis_equipment_system.reservation.entity.enumerator.ReservationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    @Query("""
            SELECT COUNT(r) > 0 FROM Reservation r
            WHERE r.equipment.id = :equipmentId
              AND r.status = :status
              AND r.dateStartTime < :end
              AND r.dateEndTime > :start
            """)
    boolean overlaps(@Param("equipmentId") Long equipmentId,
                      @Param("status") ReservationStatus status,
                      @Param("start") LocalDateTime start,
                      @Param("end") LocalDateTime end);


    @Query("""
        SELECT r.equipment.id AS equipmentId,
               r.equipment.name AS equipmentName,
               r.equipment.category AS category,
               COUNT(r) AS reservationCount
        FROM Reservation r
        GROUP BY r.equipment.id, r.equipment.name, r.equipment.category
        ORDER BY COUNT(r) DESC
        """)
    List<EquipmentReservationCount> findTopRequestedEquipment(Pageable pageable);

    @Query("""
            SELECT r.equipment.category AS category, COUNT(r) AS reservationCount
            FROM Reservation r
            GROUP BY r.equipment.category
            ORDER BY COUNT(r) DESC
            """)
    List<CategoryReservationCount> countReservationsByCategory();

    long countByStatus(ReservationStatus status);

    Page<Reservation> findByEquipmentId(Long equipmentId, Pageable pageable);
}