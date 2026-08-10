package com.lisudea.equipmentreservation.repository;

import com.lisudea.equipmentreservation.entity.Equipment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface EquipmentRepository extends JpaRepository<Equipment, Long> {
    Optional<Equipment> findBySerialNumber(String serialNumber);
    Optional<Equipment> findByMacAddress(String macAddress);

    @Query("select e from Equipment e " +
           "where (:categoryId is null or e.category.id = :categoryId) " +
           "  and (:statusId is null or e.operationalStatus.id = :statusId)")
    Page<Equipment> findByOptionalFilters(@Param("categoryId") Long categoryId,
                                         @Param("statusId") Long statusId,
                                         Pageable pageable);
}
