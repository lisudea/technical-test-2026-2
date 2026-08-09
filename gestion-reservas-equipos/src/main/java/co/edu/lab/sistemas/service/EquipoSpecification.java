package co.edu.lab.sistemas.service;

import co.edu.lab.sistemas.enums.EstadoFisico;
import co.edu.lab.sistemas.model.Equipo;
import org.springframework.data.jpa.domain.Specification;

// Especificaciones reutilizables para filtrar equipos.
public final class EquipoSpecification {

    private EquipoSpecification() {
    }

    public static Specification<Equipo> conCategoriaId(Long categoriaId) {
        return (root, query, cb) -> categoriaId == null
                ? cb.conjunction()
                : cb.equal(root.get("categoria").get("id"), categoriaId);
    }

    public static Specification<Equipo> conEstadoFisico(EstadoFisico estadoFisico) {
        return (root, query, cb) -> estadoFisico == null
                ? cb.conjunction()
                : cb.equal(root.get("estadoFisico"), estadoFisico);
    }
}