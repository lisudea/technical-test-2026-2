package com.udea.labreservas.repository;

import com.udea.labreservas.entity.LabEquipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface LabEquipmentRepository
        extends JpaRepository<LabEquipment, Integer>, JpaSpecificationExecutor<LabEquipment> {
}