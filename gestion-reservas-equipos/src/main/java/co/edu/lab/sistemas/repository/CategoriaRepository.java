package co.edu.lab.sistemas.repository;

import co.edu.lab.sistemas.model.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;

// CRUD basico para la tabla de categorias.
public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
}