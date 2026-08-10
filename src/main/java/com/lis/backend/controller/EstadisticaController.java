package com.lis.backend.controller;

import com.lis.backend.dto.CategoriaStatsResponse;
import com.lis.backend.dto.ResumenResponse;
import com.lis.backend.dto.TopEquipoResponse;
import com.lis.backend.service.EstadisticaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/estadisticas")
@Tag(name = "Estadísticas", description = "Indicadores y estadísticas del sistema")
@CrossOrigin
public class EstadisticaController {

    private final EstadisticaService service;

    public EstadisticaController(EstadisticaService service) {
        this.service = service;
    }

    @GetMapping("/top-equipos")
    @Operation(summary = "Top 5 de equipos más solicitados históricamente")
    public List<TopEquipoResponse> topEquipos() {
        return service.top5();
    }

    @GetMapping("/resumen")
    @Operation(summary = "Resumen para el dashboard")
    public ResumenResponse resumen() {
        return service.resumen();
    }

    @GetMapping("/categorias")
    @Operation(summary = "Distribución de equipos por categoría")
    public List<CategoriaStatsResponse> categorias() {
        return service.categorias();
    }
}
