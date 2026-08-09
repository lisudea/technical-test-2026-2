package co.edu.lab.sistemas.service;

import co.edu.lab.sistemas.enums.EstadoReserva;
import co.edu.lab.sistemas.model.Reserva;
import org.springframework.data.jpa.domain.Specification;

// Especificaciones reutilizables para filtrar reservas.
public final class ReservaSpecification {

    private ReservaSpecification() {
    }

    public static Specification<Reserva> conEquipoId(Long equipoId) {
        return (root, query, cb) -> equipoId == null
                ? cb.conjunction()
                : cb.equal(root.get("equipo").get("id"), equipoId);
    }

    public static Specification<Reserva> conEstadoReserva(EstadoReserva estadoReserva) {
        return (root, query, cb) -> estadoReserva == null
                ? cb.conjunction()
                : cb.equal(root.get("estadoReserva"), estadoReserva);
    }
}