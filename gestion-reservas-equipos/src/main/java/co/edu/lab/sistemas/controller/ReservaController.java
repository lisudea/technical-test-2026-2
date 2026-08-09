package co.edu.lab.sistemas.controller;

import co.edu.lab.sistemas.dto.ReservaRequestDTO;
import co.edu.lab.sistemas.dto.ReservaResponseDTO;
import co.edu.lab.sistemas.enums.EstadoReserva;
import co.edu.lab.sistemas.service.ReservaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reservas")
@RequiredArgsConstructor
public class ReservaController {

    private final ReservaService reservaService;

    @PostMapping
    public ResponseEntity<ReservaResponseDTO> crear(@Valid @RequestBody ReservaRequestDTO request) {
        ReservaResponseDTO creada = reservaService.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ReservaResponseDTO> cancelar(@PathVariable Long id) {
        return ResponseEntity.ok(reservaService.cancelar(id));
    }

    @GetMapping
    public ResponseEntity<Page<ReservaResponseDTO>> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long equipoId,
            @RequestParam(required = false) EstadoReserva estadoReserva
    ) {
        return ResponseEntity.ok(
                reservaService.listar(PageRequest.of(page, size), equipoId, estadoReserva)
        );
    }
}