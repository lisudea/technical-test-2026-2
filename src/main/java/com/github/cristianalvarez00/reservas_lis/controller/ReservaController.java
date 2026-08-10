package com.github.cristianalvarez00.reservas_lis.controller;

import com.github.cristianalvarez00.reservas_lis.dto.ReservaRequest;
import com.github.cristianalvarez00.reservas_lis.dto.ReservaResponse;
import com.github.cristianalvarez00.reservas_lis.service.ReservaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import com.github.cristianalvarez00.reservas_lis.dto.EstadisticaEquipoResponse;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
/*
CONTROLADOR DE RESERVAS:
Contiene los endpoints para crear, consultar y cancelar reservas.
También se agregó el endpoint de estadísticas que devuelve los 5 equipos más reservados.
*/
@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/reservas")

public class ReservaController {

    @Autowired
    ReservaService reservaService;

    // GET /reservas/{idEstudiante}: lista las reservas pertenecientes a un estudiante.
    @GetMapping("/{idEstudiante}")
    public ResponseEntity<List<ReservaResponse>> obtenerReservasEstudiante(@PathVariable Long idEstudiante){
        List<ReservaResponse> reservas = reservaService.listarPorId(idEstudiante);
        return ResponseEntity.ok(reservas);
    }
    // GET /reservas/estadisticas/top-equipos: muestra los 5 equipos con mayor cantidad de reservas.
    @GetMapping("/estadisticas/top-equipos")
    public ResponseEntity<List<EstadisticaEquipoResponse>> obtenerTopEquipos(){
        return ResponseEntity.ok(reservaService.obtenerTopEquipos());
    }
    // POST /reservas: crea una reserva después de pasar las validaciones del servicio.
    @PostMapping
    public ResponseEntity<ReservaResponse> crear(@RequestBody ReservaRequest reserva){
        return ResponseEntity.status(HttpStatus.CREATED).body(reservaService.crearReserva(reserva));
    }
    // DELETE /reservas/{idReserva}: cancela una reserva eliminándola de la base de datos.
    @DeleteMapping("/{idReserva}")
    public ResponseEntity<Void> eliminar(@PathVariable Long idReserva){
        reservaService.eliminarReserva(idReserva);
        return ResponseEntity.noContent().build();
    }
}
