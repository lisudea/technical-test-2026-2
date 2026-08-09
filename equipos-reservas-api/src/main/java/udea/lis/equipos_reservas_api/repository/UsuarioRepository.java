package udea.lis.equipos_reservas_api.repository;

// Importamos las clases necesarias para trabajar con la entidad Usuario.
import udea.lis.equipos_reservas_api.model.Usuario;

// Importamos las clases necesarias para trabajar con el repositorio de JPA.
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Esta interfaz es un repositorio de Spring Data JPA para la entidad Usuario.
// Extiende JpaRepository, lo que le proporciona métodos CRUD por defecto.
// El <Long> hace referencia al tipo de dato del id de la entidad Usuario, que es Long.
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // Este método busca un usuario por su correo electrónico.
    // Se utiliza para evitar crear usuarios duplicados en la base de datos.
    // Devuelve un Optional<Usuario> que puede contener un usuario si se encuentra uno con 
    // el correo especificado, o estar vacío si no se encuentra ninguno.
    Optional<Usuario> findByCorreo(String correo);
}