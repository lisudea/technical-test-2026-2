package co.edu.lab.sistemas.controller;

import co.edu.lab.sistemas.dto.TopEquipoDTO;
import co.edu.lab.sistemas.service.EstadisticaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/estadisticas")
@RequiredArgsConstructor
public class EstadisticaController {

    private final EstadisticaService estadisticaService;

    @GetMapping("/top-equipos")
    public ResponseEntity<List<TopEquipoDTO>> obtenerTopEquipos(
            @RequestParam(required = false) LocalDateTime desde,
            @RequestParam(required = false) LocalDateTime hasta
    ) {
        return ResponseEntity.ok(estadisticaService.obtenerTopEquipos(desde, hasta));
    }
}