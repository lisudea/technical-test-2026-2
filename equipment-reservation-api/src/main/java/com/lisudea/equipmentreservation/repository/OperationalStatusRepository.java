package com.lisudea.equipmentreservation.repository;

import com.lisudea.equipmentreservation.entity.OperationalStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OperationalStatusRepository extends JpaRepository<OperationalStatus, Long> {
}
