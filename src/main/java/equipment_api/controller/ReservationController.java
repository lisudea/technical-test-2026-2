package equipment_api.controller;

import equipment_api.dto.ReservationRequest;
import equipment_api.dto.ReservationResponse;
import equipment_api.entity.Reservation;
import equipment_api.service.ReservationService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    /**
     * Crea una reserva.
     *
     * Con sesion/JWT: la identidad se toma del token y el cuerpo solo aporta
     * equipo y fechas. Sin autenticar: el cuerpo debe incluir `userName` y
     * `userEmail` (requisito obligatorio del enunciado).
     *
     * Responde 201 si se crea y 409 si la franja se cruza con otra reserva.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReservationResponse createReservation(
            @Valid @RequestBody ReservationRequest request,
            Authentication authentication) {

        Reservation reservation = reservationService.createReservation(
                request.getEquipmentId(),
                resolveAuthenticatedEmail(authentication),
                request.getUserName(),
                request.getUserEmail(),
                request.getStartTime(),
                request.getEndTime()
        );

        return new ReservationResponse(reservation);
    }

    // Consultar reservas de un equipo
    @GetMapping("/equipment/{equipmentId}")
    public List<ReservationResponse> getReservationsByEquipment(
            @PathVariable Long equipmentId) {

        return reservationService.getReservationsByEquipment(equipmentId);
    }

    /**
     * Cancela una reserva propia (cancelacion logica: pasa a CANCELLED).
     *
     * El correo del solicitante sale del token si la peticion viene
     * autenticada; si no, del parametro `email`. Debe coincidir con el dueno de
     * la reserva o se responde 403.
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelReservation(
            @PathVariable Long id,
            @RequestParam(name = "email", required = false) String email,
            Authentication authentication) {

        String authenticatedEmail = resolveAuthenticatedEmail(authentication);

        reservationService.cancelReservation(
                id,
                authenticatedEmail != null ? authenticatedEmail : email
        );
    }

    // Consultar todas las reservas
    @GetMapping
    public List<ReservationResponse> getAllReservations() {
        return reservationService.getAllReservations();
    }

    /**
     * Devuelve el email autenticado, o null si la peticion es anonima.
     *
     * Ojo: cuando un endpoint es publico, Spring Security inyecta un
     * AnonymousAuthenticationToken (cuyo getName() es "anonymousUser"), no null.
     * Si no se filtra, se intentaria buscar un usuario llamado "anonymousUser".
     */
    private String resolveAuthenticatedEmail(Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return null;
        }

        return authentication.getName();
    }
}