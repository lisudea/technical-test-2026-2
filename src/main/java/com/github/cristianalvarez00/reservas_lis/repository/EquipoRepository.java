package com.github.cristianalvarez00.reservas_lis.repository;

import com.github.cristianalvarez00.reservas_lis.enums.CategoriaEquipo;
import com.github.cristianalvarez00.reservas_lis.enums.EstadoEquipo;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import com.github.cristianalvarez00.reservas_lis.model.Equipo;
import java.util.Optional;

/*
REPOSITORIO DE EQUIPOS:
Spring Data se encarga de las operaciones normales de base de datos.
Además se agregan búsquedas por numero de serie, categoria y estado.
*/
@Repository
public interface EquipoRepository extends JpaRepository<Equipo, Long>{
    Optional<Equipo> findByNumSerie(String numSerie);
    Page<Equipo> findByCategoria(CategoriaEquipo categoria, Pageable pageable);
    Page<Equipo> findByEstado(EstadoEquipo estado, Pageable pageable);

}
