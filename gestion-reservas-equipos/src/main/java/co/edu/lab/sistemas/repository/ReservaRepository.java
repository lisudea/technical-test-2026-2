package co.edu.lab.sistemas.repository;

import co.edu.lab.sistemas.model.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;

// CRUD basico para las reservas de uso de equipos.
public interface ReservaRepository extends JpaRepository<Reserva, Long> {
}