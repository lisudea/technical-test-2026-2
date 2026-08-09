package co.edu.lab.sistemas.repository;

import co.edu.lab.sistemas.model.Equipo;
import org.springframework.data.jpa.repository.JpaRepository;

// CRUD basico para los equipos de laboratorio.
public interface EquipoRepository extends JpaRepository<Equipo, Long> {
}