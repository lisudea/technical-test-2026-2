package co.edu.udea.lis.lisource.reservation.api;

import co.edu.udea.lis.lisource.reservation.api.ReservationDtos.*;
import co.edu.udea.lis.lisource.reservation.application.ReservationService;
import co.edu.udea.lis.lisource.shared.security.SecurityPrincipal;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class ReservationController {
    private final ReservationService service;
    public ReservationController(ReservationService service) { this.service = service; }

    @PostMapping("/reservations")
    public ResponseEntity<ReservationResponse> create(@Valid @RequestBody CreateReservationRequest request) {
        ReservationResponse result = service.create(request, SecurityPrincipal.userId());
        return ResponseEntity.created(URI.create("/api/v1/reservations/" + result.id())).body(result);
    }

    @GetMapping("/reservations/me")
    public List<ReservationResponse> mine() { return service.listMine(SecurityPrincipal.userId()); }

    @GetMapping("/reservations/{id}")
    public ReservationResponse get(@PathVariable long id) {
        return service.get(id, SecurityPrincipal.userId(), SecurityPrincipal.isAdmin());
    }

    @PostMapping("/reservations/{id}/cancel")
    public ReservationResponse cancel(@PathVariable long id,
                                      @Valid @RequestBody(required = false) CancelReservationRequest request) {
        return service.cancel(id, SecurityPrincipal.userId(), SecurityPrincipal.isAdmin(),
                request == null ? null : request.reason());
    }

    @GetMapping("/equipment/{id}/busy-slots")
    public List<BusySlot> busySlots(@PathVariable long id) { return service.busySlots(id); }

    @GetMapping("/equipment/{id}/availability")
    public Map<String, Boolean> availability(@PathVariable long id,
                                             @RequestParam Instant startsAt,
                                             @RequestParam Instant endsAt) {
        return Map.of("available", service.available(id, startsAt, endsAt));
    }
}
