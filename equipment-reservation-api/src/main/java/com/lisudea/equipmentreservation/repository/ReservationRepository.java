package com.lisudea.equipmentreservation.repository;

import com.lisudea.equipmentreservation.entity.Equipment;
import com.lisudea.equipmentreservation.entity.Reservation;
import com.lisudea.equipmentreservation.entity.ReservationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    Page<Reservation> findAllByOrderByStartAtAsc(Pageable pageable);
    Page<Reservation> findByStatus_NameOrderByStartAtAsc(String statusName, Pageable pageable);

    Page<Reservation> findByEquipmentOrderByStartAtAsc(Equipment equipment, Pageable pageable);

    List<Reservation> findByEquipmentAndStatusAndEndAtAfterOrderByStartAtAsc(Equipment equipment, ReservationStatus status, OffsetDateTime now);

    @Query("select r from Reservation r where r.equipment.id = :equipmentId and r.status.id = :statusId")
    List<Reservation> findByEquipmentAndStatus(@Param("equipmentId") Long equipmentId, @Param("statusId") Long statusId);

    @Query("select new com.lisudea.equipmentreservation.dto.response.TopEquipmentResponse(r.equipment.id, r.equipment.name, count(r)) " +
            "from Reservation r where r.status.id in (1,2) group by r.equipment.id, r.equipment.name order by count(r) desc")
        List<com.lisudea.equipmentreservation.dto.response.TopEquipmentResponse> findTopReservedEquipment(Pageable pageable);

        @Query(value = "SELECT EXISTS ( " +
            " SELECT 1 FROM reservation r " +
            " WHERE r.equipment_id = :equipmentId " +
            "   AND r.reservation_status_id = :activeStatusId " +
            "   AND NOT (r.end_at <= :startAt OR r.start_at >= :endAt) " +
            ")", nativeQuery = true)
        boolean existsActiveOverlap(
            @Param("equipmentId") Long equipmentId,
            @Param("startAt") OffsetDateTime startAt,
            @Param("endAt") OffsetDateTime endAt,
            @Param("activeStatusId") Long activeStatusId);
}
