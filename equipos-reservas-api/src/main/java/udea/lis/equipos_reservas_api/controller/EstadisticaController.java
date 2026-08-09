package udea.lis.equipos_reservas_api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import udea.lis.equipos_reservas_api.dto.TopEquipoResponse;
import udea.lis.equipos_reservas_api.service.EstadisticaService;

import java.util.List;

// Controlador REST para la consulta de estadísticas del laboratorio. Expone el endpoint del Top 5 de los equipos
// más solicitados históricamente, delegando el cálculo al EstadisticaService.
@RestController
@RequestMapping("/api/estadisticas")
public class EstadisticaController {

    // Inyección de la dependencia del servicio de estadísticas para calcular los reportes solicitados.
    private final EstadisticaService estadisticaService;

    public EstadisticaController(EstadisticaService estadisticaService) {
        this.estadisticaService = estadisticaService;
    }

    // Endpoint para consultar el Top 5 de equipos más solicitados. Devuelve una lista con los equipos y su
    // cantidad de solicitudes históricas registradas.
    @GetMapping("/top-5")
    public List<TopEquipoResponse> top5() {
        return estadisticaService.top5EquiposMasSolicitados();
    }
}
