package udea.lis.equipos_reservas_api.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import udea.lis.equipos_reservas_api.dto.PageResponse;
import udea.lis.equipos_reservas_api.dto.ReservaRequest;
import udea.lis.equipos_reservas_api.dto.ReservaResponse;
import udea.lis.equipos_reservas_api.model.EstadoReserva;
import udea.lis.equipos_reservas_api.service.ReservaService;

// Controlador REST para la gestión de reservas del laboratorio. Expone los endpoints de creación, cancelación
// (soft delete: la reserva no se elimina, solo cambia su estado) y listado paginado con filtros, delegando la
// lógica de negocio al ReservaService.
@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

    // Inyección de la dependencia del servicio de reservas para manejar la lógica de negocio relacionada con las reservas.
    private final ReservaService reservaService;

    public ReservaController(ReservaService reservaService) {
        this.reservaService = reservaService;
    }

    // Endpoint para crear una nueva reserva. Recibe un objeto ReservaRequest validado y devuelve un objeto
    // ReservaResponse con los datos de la reserva registrada. Responde con HTTP 201 (CREATED).
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReservaResponse crear(@Valid @RequestBody ReservaRequest request) {
        return reservaService.crearReserva(request);
    }

    // Endpoint para cancelar una reserva existente. Cambia el estado de la reserva sin eliminarla físicamente.
    @PostMapping("/{id}/cancelar")
    public ReservaResponse cancelar(@PathVariable Long id) {
        return reservaService.cancelarReserva(id);
    }

    // Endpoint para listar las reservas de forma paginada, con la posibilidad de filtrar por equipo y estado.
    // Recibe parámetros opcionales de equipo y estado, así como parámetros de paginación (página y tamaño).
    // Devuelve un objeto PageResponse con los datos de las reservas.
    @GetMapping
    public PageResponse<ReservaResponse> listar(
            @RequestParam(required = false) Long equipoId,
            @RequestParam(required = false) EstadoReserva estado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        // Se limita la página a un valor mínimo de 0 y el tamaño a un rango entre 1 y 100.
        return reservaService.listarReservas(equipoId, estado, Math.max(page, 0), Math.min(Math.max(size, 1), 100));
    }
}
