package com.lisudea.equipmentreservation.repository;

import com.lisudea.equipmentreservation.entity.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReservationStatusRepository extends JpaRepository<ReservationStatus, Long> {
}
