package com.lis.reservas.common.repository;

import com.lis.reservas.common.entity.LogActividad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for the optional {@link LogActividad} audit log.
 */
@Repository
public interface LogActividadRepository extends JpaRepository<LogActividad, Long> {
}
