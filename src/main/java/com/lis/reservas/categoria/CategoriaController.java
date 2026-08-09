package com.lis.reservas.categoria;

import com.lis.reservas.categoria.dto.CategoriaRequest;
import com.lis.reservas.categoria.dto.CategoriaResponse;
import com.lis.reservas.categoria.service.CategoriaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

/**
 * REST controller for the {@code /api/v1/categorias} resource.
 *
 * <p>The catalog is read-mostly: listing and lookup are public (no JWT), while
 * creation requires an authenticated lab admin (Phase 4 wires the JWT guard;
 * the endpoint already exists so the contract is stable). The service returns
 * response projections, so the controller stays a thin transport layer that
 * owns only HTTP semantics (status codes, the {@code Location} header).
 */
@RestController
@RequestMapping("/api/v1/categorias")
@RequiredArgsConstructor
public class CategoriaController {

    private final CategoriaService categoriaService;

    /**
     * List every categoria. Public.
     */
    @GetMapping
    public List<CategoriaResponse> list() {
        return categoriaService.findAll();
    }

    /**
     * Get a categoria by id. Public. 404 when absent (mapped by the advice).
     */
    @GetMapping("/{id}")
    public CategoriaResponse getById(@PathVariable Integer id) {
        return categoriaService.findById(id);
    }

    /**
     * Create a categoria. JWT-protected from Phase 4 onward. Returns 201 with
     * a {@code Location} pointing at the new resource.
     */
    @PostMapping
    public ResponseEntity<CategoriaResponse> create(@Valid @RequestBody CategoriaRequest request) {
        CategoriaResponse created = categoriaService.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequestUri()
                .path("/{id}")
                .buildAndExpand(created.idCategoria())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }
}
