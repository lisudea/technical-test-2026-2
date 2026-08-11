package equipment_api.repository;

import equipment_api.entity.Equipment;
import equipment_api.entity.EquipmentCategory;
import equipment_api.entity.EquipmentStatus;

import jakarta.persistence.LockModeType;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface EquipmentRepository extends JpaRepository<Equipment, Long> {

    Page<Equipment> findByCategory(
            EquipmentCategory category,
            Pageable pageable
    );

    Page<Equipment> findByStatus(
            EquipmentStatus status,
            Pageable pageable
    );

    Page<Equipment> findByCategoryAndStatus(
            EquipmentCategory category,
            EquipmentStatus status,
            Pageable pageable
    );

    Optional<Equipment> findBySerialNumber(String serialNumber);

    long countByStatus(EquipmentStatus status);

    /**
     * Carga el equipo con bloqueo pesimista (SELECT ... FOR UPDATE).
     *
     * Sin esto, dos peticiones simultaneas para la misma franja podrian pasar
     * las dos la comprobacion de solapamiento y crear una doble reserva. El
     * bloqueo serializa las reservas POR EQUIPO: dos usuarios reservando
     * equipos distintos no se estorban.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Equipment e WHERE e.id = :id")
    Optional<Equipment> findByIdForUpdate(@Param("id") Long id);
}