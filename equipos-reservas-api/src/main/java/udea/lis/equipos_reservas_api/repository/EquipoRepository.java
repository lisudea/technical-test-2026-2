package udea.lis.equipos_reservas_api.repository;
//Importamos las clases necesarias para trabajar con la entidad Equipo.
import udea.lis.equipos_reservas_api.model.CategoriaEquipo;
import udea.lis.equipos_reservas_api.model.Equipo;
import udea.lis.equipos_reservas_api.model.EstadoEquipo;

// Importamos las clases necesarias para trabajar con la paginación y el repositorio de JPA.
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

// Esta interfaz es un repositorio de Spring Data JPA para la entidad Equipo. 
// Extiende JpaRepository, lo que le proporciona métodos CRUD y de paginación por defecto. Además, define métodos 
// personalizados para buscar equipos por categoría y estado, así como para verificar la existencia de un equipo por su 
// número de serie. El <Long> hace referencia al tipo de dato del id de la entidad Equipo, que es Long.
public interface EquipoRepository extends JpaRepository<Equipo, Long> {

    // Page<Equipo> indica que el método devuelve una página de objetos Equipo. 
    // Luego, findByCategoria es el nombre del método, que sigue la convención de nomenclatura de Spring Data JPA para generar 
    // consultas automáticamente. El parámetro CategoriaEquipo es el valor que se utilizará para filtrar los equipos por su
    // categoría. Finalmente, Pageable pageable es un objeto que contiene información sobre la paginación, como el número de 
    // página y el tamaño de la página.
    Page<Equipo> findByCategoria(CategoriaEquipo categoria, Pageable pageable);

    // Este método es similar al anterior, pero filtra los equipos por su estado en lugar de su categoría.
    Page<Equipo> findByEstado(EstadoEquipo estado, Pageable pageable);

    Page<Equipo> findByCategoriaAndEstado(CategoriaEquipo categoria, EstadoEquipo estado, Pageable pageable);

    // Este método verifica si existe un equipo con un número de serie específico. Devuelve true si existe, y false si no.
    boolean existsByNumeroSerie(String numeroSerie); 
}