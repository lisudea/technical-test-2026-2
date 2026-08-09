package co.edu.lab.sistemas.controller;

import co.edu.lab.sistemas.dto.EquipoRequestDTO;
import co.edu.lab.sistemas.dto.EquipoResponseDTO;
import co.edu.lab.sistemas.enums.EstadoFisico;
import co.edu.lab.sistemas.service.EquipoService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/equipos")
@RequiredArgsConstructor
public class EquipoController {

    private final EquipoService equipoService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EquipoResponseDTO> crear(@Valid @RequestBody EquipoRequestDTO request) {
        EquipoResponseDTO creado = equipoService.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EquipoResponseDTO> actualizar(@PathVariable Long id, @Valid @RequestBody EquipoRequestDTO request) {
        return ResponseEntity.ok(equipoService.actualizar(id, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EquipoResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(equipoService.buscarPorId(id));
    }

    @GetMapping
    public ResponseEntity<Page<EquipoResponseDTO>> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long categoriaId,
            @RequestParam(required = false) EstadoFisico estadoFisico
    ) {
        return ResponseEntity.ok(
                equipoService.listar(PageRequest.of(page, size), categoriaId, estadoFisico)
        );
    }
}