package com.lis.reservas.estadisticas;

import com.lis.reservas.estadisticas.dto.EquipoTopResponse;
import com.lis.reservas.estadisticas.service.EstadisticasService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for the {@code /api/v1/estadisticas} resource.
 *
 * <p>The Top-N most-reserved equipment ranking is a read-only, public
 * aggregate: it does not expose identifying user information, so (like the
 * equipment catalog) it is left open. The backing
 * {@code estadisticas_equipos_top} VIEW already excludes cancelled
 * reservations, so the service only applies the {@code limit}.
 */
@RestController
@RequestMapping("/api/v1/estadisticas")
@RequiredArgsConstructor
public class EstadisticasController {

    /** Upper bound for the {@code limit} parameter to protect the ranking query. */
    private static final int MAX_LIMIT = 50;

    private final EstadisticasService estadisticasService;

    /**
     * Top-N most-reserved equipos. {@code limit} defaults to 5 and is capped
     * to {@link #MAX_LIMIT} to keep the query bounded.
     */
    @GetMapping("/equipos-top")
    public List<EquipoTopResponse> topEquipos(
            @RequestParam(name = "limit", defaultValue = "5") int limit) {
        return estadisticasService.getTopEquipos(Math.min(Math.max(limit, 1), MAX_LIMIT));
    }
}
