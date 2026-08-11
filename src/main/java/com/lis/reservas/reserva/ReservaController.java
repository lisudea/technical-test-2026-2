package com.lis.reservas.reserva;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import com.lis.reservas.common.dto.PagedResponse;
import com.lis.reservas.reserva.dto.ReservaCreateRequest;
import com.lis.reservas.reserva.dto.ReservaResponse;
import com.lis.reservas.reserva.service.ReservaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.time.OffsetDateTime;

/**
 * REST controller for the {@code /api/v1/reservas} resource.
 *
 * <p>Reservation creation is the concurrency hotspot of the system: the
 * service acquires a {@code FOR UPDATE} lock and rejects overlapping windows
 * with {@code 409 Conflict}. On success the controller returns
 * {@code 201 Created} with a {@code Location} header pointing at the new
 * reserva. Listing and lookup are JWT-protected (Phase 4) because reservations
 * carry user identifying information, unlike the public equipment catalog.
 *
 * <p>Cancellation is a soft delete: {@code DELETE} flips the reserva to
 * {@code CANCELADA} (kept for audit and statistics) and returns the updated
 * projection.
 */
@RestController
@RequestMapping("/api/v1/reservas")
@RequiredArgsConstructor
public class ReservaController {

    private final ReservaService reservaService;

    /**
     * Create a reservation. Returns 201 + Location, or 409 on overlap.
     */
    @PostMapping
    @Operation(summary = "Crear una reserva",
                description = "Un ESTUDIANTE solo puede reservar a su propio nombre: el correoUsuario "
                        + "del cuerpo se ignora en favor del principal del token. El personal "
                        + "(AUXILIAR / ADMIN) sí puede reservar en nombre de otra persona.")
        @ApiResponses({
                @ApiResponse(responseCode = "201", description = "Reserva creada, con cabecera Location"),
                @ApiResponse(responseCode = "400", description = "Franja inválida (inicio >= fin, en el pasado o supera la duración máxima)"),
                @ApiResponse(responseCode = "403", description = "El usuario tiene una sanción vigente"),
                @ApiResponse(responseCode = "404", description = "Equipo no encontrado"),
                @ApiResponse(responseCode = "409", description = "La franja se solapa con otra reserva activa, o el equipo no está disponible")
        })
    public ResponseEntity<ReservaResponse> create(@Valid @RequestBody ReservaCreateRequest request) {
        ReservaResponse created = reservaService.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequestUri()
                .path("/{id}")
                .buildAndExpand(created.idReserva())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    /**
     * Paginated, filtered listing. Every filter is optional. JWT-protected.
     */
    @GetMapping
    @Operation(summary = "Listar reservas con filtros",
                description = "Un ESTUDIANTE solo ve las suyas, cualquiera que sea el filtro pedido. "
                        + "AUXILIAR y ADMIN ven todas.")
        @ApiResponse(responseCode = "200", description = "Página de reservas")
    public PagedResponse<ReservaResponse> list(
            @RequestParam(required = false) Integer idEquipo,
            @RequestParam(required = false) String correoUsuario,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime desde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime hasta,
            @RequestParam(required = false) String estado,
            Pageable pageable) {
        return reservaService.list(idEquipo, correoUsuario, desde, hasta, estado, pageable);
    }

    /**
     * Get a reserva by id. JWT-protected. 404 when absent.
     */
    @GetMapping("/{id}")
    @Operation(summary = "Obtener una reserva por id")
        @ApiResponses({
                @ApiResponse(responseCode = "200", description = "Reserva encontrada"),
                @ApiResponse(responseCode = "404", description = "No existe, o pertenece a otra persona (se oculta como 404 para no confirmar el id)")
        })
    public ReservaResponse getById(@PathVariable Long id) {
        return reservaService.findById(id);
    }

    /**
     * Cancel a reservation (soft delete). JWT-protected. Returns the
     * cancelled reserva.
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Cancelar una reserva (soft delete)",
                description = "La fila se conserva para auditoría y estadísticas.")
        @ApiResponses({
                @ApiResponse(responseCode = "200", description = "Reserva cancelada"),
                @ApiResponse(responseCode = "404", description = "No existe, o pertenece a otra persona")
        })
    public ReservaResponse cancel(@PathVariable Long id) {
        return reservaService.cancel(id);
    }
}
