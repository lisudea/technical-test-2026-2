package com.lis.reservas.estadisticas.service;

import com.lis.reservas.estadisticas.dto.EquipoTopResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Application service backing {@code GET /api/v1/estadisticas/equipos-top}.
 *
 * <p>The ranking is served from the {@code estadisticas_equipos_top} VIEW
 * (created by the V3 migration), which already excludes cancelled
 * reservations from its {@code COUNT(r.id_reserva)}. There is no JPA entity
 * modelling a database view, so the query is executed natively through
 * {@link EntityManager} and each row projected into {@link EquipoTopResponse}.
 */
@Service
public class EstadisticasService {

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * @param limit maximum number of equipos to return (applied server-side
     *              via {@code setMaxResults}).
     * @return the top-N most-reserved equipos, ordered by total reservations
     *         descending.
     */
    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<EquipoTopResponse> getTopEquipos(int limit) {
        String sql = """
                SELECT id_equipo, nombre, categoria, total_reservas
                FROM estadisticas_equipos_top
                ORDER BY total_reservas DESC
                """;
        List<Object[]> rows = entityManager.createNativeQuery(sql)
                .setMaxResults(limit)
                .getResultList();

        List<EquipoTopResponse> result = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            Integer idEquipo = ((Number) row[0]).intValue();
            String nombre = (String) row[1];
            String categoria = (String) row[2];
            long totalReservas = ((Number) row[3]).longValue();
            result.add(new EquipoTopResponse(idEquipo, nombre, categoria, totalReservas));
        }
        return result;
    }
}
