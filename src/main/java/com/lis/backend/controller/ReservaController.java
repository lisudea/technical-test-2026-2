package com.lis.backend.controller;

import com.lis.backend.dto.ReservaRequest;
import com.lis.backend.dto.ReservaResponse;
import com.lis.backend.entity.EstadoReserva;
import com.lis.backend.service.ReservaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservas")
@Tag(name = "Reservas", description = "Creación, consulta y cancelación de reservas")
@CrossOrigin
public class ReservaController {

    private final ReservaService service;

    public ReservaController(ReservaService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear una reserva validando conflictos de horario")
    public ReservaResponse crear(@Valid @RequestBody ReservaRequest request) {
        return service.crear(request);
    }

    @GetMapping
    @Operation(summary = "Listar reservas con filtros")
    public Page<ReservaResponse> listar(

            @Parameter(description = "Estado de la reserva")
            @RequestParam(required = false) EstadoReserva estado,

            @Parameter(description = "ID del equipo asociado a la reserva")
            @RequestParam(required = false) Long equipoId,

            @Parameter(description = "Correo del usuario que hizo la reserva")
            @RequestParam(required = false) String correoUsuario,

            @Parameter(description = "Número de página. Empieza en 0.")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Cantidad de reservas por página")
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);

        return service.listar(estado, equipoId, correoUsuario, pageable);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consultar una reserva por ID")
    public ReservaResponse obtener(@PathVariable Long id) {
        return service.obtener(id);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Cancelar una reserva")
    public ReservaResponse cancelar(@PathVariable Long id) {
        return service.cancelar(id);
    }

    @GetMapping("/equipo/{equipoId}")
    @Operation(summary = "Listar reservas de un equipo")
    public List<ReservaResponse> listarPorEquipo(@PathVariable Long equipoId) {
        return service.listarPorEquipo(equipoId);
    }
}