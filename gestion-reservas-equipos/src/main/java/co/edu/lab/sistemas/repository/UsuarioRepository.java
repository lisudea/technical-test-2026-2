package co.edu.lab.sistemas.repository;

import co.edu.lab.sistemas.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

// CRUD basico para los usuarios administrativos.
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
}