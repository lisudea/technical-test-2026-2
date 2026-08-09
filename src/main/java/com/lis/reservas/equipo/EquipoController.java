package com.lis.reservas.equipo;

import com.lis.reservas.common.dto.PagedResponse;
import com.lis.reservas.equipo.dto.EquipoCreateRequest;
import com.lis.reservas.equipo.dto.EquipoResponse;
import com.lis.reservas.equipo.dto.EquipoUpdateRequest;
import com.lis.reservas.equipo.dto.EstadoPatchRequest;
import com.lis.reservas.equipo.service.EquipoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

/**
 * REST controller for the {@code /api/v1/equipos} resource.
 *
 * <p>The public catalog surface is read-mostly: {@code GET} listing and lookup
 * are open to everyone, while {@code POST}/{@code PUT}/{@code PATCH} mutate the
 * catalog and require an authenticated lab admin (Phase 4 enforces JWT; the
 * endpoints already exist so the contract is stable).
 *
 * <p>Listing supports three independent, AND-combined filters expressed as
 * query parameters: {@code categoria} (category name), {@code estado}
 * (lifecycle state) and {@code nombre} (free-text fragment matched against the
 * equipo nombre). All are optional; {@code Pageable} carries page/size/sort.
 */
@RestController
@RequestMapping("/api/v1/equipos")
@RequiredArgsConstructor
public class EquipoController {

    private final EquipoService equipoService;

    /**
     * Paginated, filtered listing. Public.
     */
    @GetMapping
    public PagedResponse<EquipoResponse> list(
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String nombre,
            Pageable pageable) {
        return equipoService.findPaginated(categoria, estado, nombre, pageable);
    }

    /**
     * Get an equipo by id. Public. 404 when absent.
     */
    @GetMapping("/{id}")
    public EquipoResponse getById(@PathVariable Integer id) {
        return equipoService.findById(id);
    }

    /**
     * Create an equipo. JWT-protected from Phase 4. Returns 201 + Location.
     */
    @PostMapping
    public ResponseEntity<EquipoResponse> create(@Valid @RequestBody EquipoCreateRequest request) {
        EquipoResponse created = equipoService.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequestUri()
                .path("/{id}")
                .buildAndExpand(created.idEquipo())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    /**
     * Full update of an equipo. JWT-protected from Phase 4.
     */
    @PutMapping("/{id}")
    public EquipoResponse update(@PathVariable Integer id,
                                 @Valid @RequestBody EquipoUpdateRequest request) {
        return equipoService.update(id, request);
    }

    /**
     * Narrow estado transition. JWT-protected from Phase 4.
     */
    @PatchMapping("/{id}/estado")
    public EquipoResponse patchEstado(@PathVariable Integer id,
                                     @Valid @RequestBody EstadoPatchRequest request) {
        return equipoService.patchEstado(id, request);
    }
}
