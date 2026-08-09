package com.udea.lis.repository;

import com.udea.lis.entity.Equipment;
import com.udea.lis.entity.EquipmentCategory;
import com.udea.lis.entity.EquipmentStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, Long>,
        JpaSpecificationExecutor<Equipment> {

    boolean existsBySerialNumber(String serialNumber);

    boolean existsBySerialNumberAndIdNot(String serialNumber, Long id);

    boolean existsByMacAddress(String macAddress);

    boolean existsByMacAddressAndIdNot(String macAddress, Long id);

    List<Equipment> findByCategory(EquipmentCategory category);

    List<Equipment> findByStatus(EquipmentStatus status);

    List<Equipment> findByCategoryAndStatus(EquipmentCategory category, EquipmentStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Equipment e WHERE e.id = :id")
    Optional<Equipment> findByIdWithLock(@Param("id") Long id);
}
