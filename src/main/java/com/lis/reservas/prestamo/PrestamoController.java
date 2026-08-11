package com.lis.reservas.prestamo;

import com.lis.reservas.common.dto.PagedResponse;
import com.lis.reservas.prestamo.dto.DevolucionRequest;
import com.lis.reservas.prestamo.dto.EntregaRequest;
import com.lis.reservas.prestamo.dto.NoReclamadoRequest;
import com.lis.reservas.prestamo.dto.ResumenPrestamosResponse;
import com.lis.reservas.prestamo.service.PrestamoService;
import com.lis.reservas.reserva.dto.ReservaResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/**
 * REST controller for the {@code /api/v1/prestamos} resource — the auxiliar's
 * loan desk.
 *
 * <p>The whole surface requires AUXILIAR or ADMIN (enforced in
 * {@code SecurityConfig}). It is modelled as actions on a reservation rather
 * than as a CRUD resource, because that is what the work is: an auxiliar
 * hands equipment over, takes it back, or records that nobody came. Each
 * action is a POST to a named sub-path, so the state machine is explicit in
 * the URL instead of hidden inside a PATCH body.
 */
@RestController
@RequestMapping("/api/v1/prestamos")
@RequiredArgsConstructor
public class PrestamoController {

    private final PrestamoService prestamoService;

    /**
     * The day's queue, including equipment still out from previous days.
     */
    @Operation(summary = "Agenda de prestamos del dia (AUXILIAR / ADMIN)")
    @GetMapping("/agenda")
    public PagedResponse<ReservaResponse> agenda(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(required = false) String estadoPrestamo,
            Pageable pageable) {
        return prestamoService.agenda(fecha, estadoPrestamo, pageable);
    }

    /**
     * Counters for the console header.
     */
    @Operation(summary = "Contadores del dia para la consola del auxiliar")
    @GetMapping("/resumen")
    public ResumenPrestamosResponse resumen(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return prestamoService.resumen(fecha);
    }

    /**
     * Validate the hand-over. PENDIENTE &rarr; ENTREGADO.
     */
    @Operation(summary = "Validar la entrega fisica del equipo")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Entrega registrada"),
            @ApiResponse(responseCode = "400", description = "Estado o ventana horaria invalida"),
            @ApiResponse(responseCode = "403", description = "Requiere rol AUXILIAR o ADMIN"),
            @ApiResponse(responseCode = "404", description = "Reserva no encontrada"),
            @ApiResponse(responseCode = "409", description = "El equipo esta dado de baja")
    })
    @PostMapping("/{idReserva}/entrega")
    public ReservaResponse entregar(@PathVariable Long idReserva,
                                    @Valid @RequestBody(required = false) EntregaRequest request) {
        return prestamoService.entregar(idReserva, request);
    }

    /**
     * Check the equipment back in. ENTREGADO &rarr; DEVUELTO, and the booking
     * becomes COMPLETADA.
     */
    @Operation(summary = "Registrar la devolucion del equipo")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Devolucion registrada"),
            @ApiResponse(responseCode = "400", description = "El prestamo no estaba ENTREGADO"),
            @ApiResponse(responseCode = "404", description = "Reserva no encontrada")
    })
    @PostMapping("/{idReserva}/devolucion")
    public ReservaResponse devolver(@PathVariable Long idReserva,
                                    @Valid @RequestBody(required = false) DevolucionRequest request) {
        return prestamoService.devolver(idReserva, request);
    }

    /**
     * Declare a no-show. PENDIENTE &rarr; NO_RECLAMADO; the booking is
     * cancelled so the slot is freed, and the automatic sanction may follow.
     */
    @Operation(summary = "Declarar una reserva como no reclamada")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Reserva marcada como no reclamada"),
            @ApiResponse(responseCode = "400", description = "Estado invalido o margen de espera no cumplido"),
            @ApiResponse(responseCode = "404", description = "Reserva no encontrada")
    })
    @PostMapping("/{idReserva}/no-reclamado")
    public ReservaResponse marcarNoReclamado(
            @PathVariable Long idReserva,
            @Valid @RequestBody(required = false) NoReclamadoRequest request) {
        return prestamoService.marcarNoReclamado(idReserva, request);
    }
}
