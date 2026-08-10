package com.github.cristianalvarez00.reservas_lis.repository;

import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.github.cristianalvarez00.reservas_lis.model.Estudiante;

import java.util.Optional;

/*
REPOSITORIO DE ESTUDIANTES:
Maneja el acceso a la tabla de estudiantes y permite consultar por correo.
*/
@Repository
public interface EstudianteRepository extends JpaRepository<Estudiante, Long> {
    Optional<Estudiante> findByCorreo(String correo);
}
