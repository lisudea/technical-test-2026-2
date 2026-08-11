package com.lis.reservas.sancion;

import com.lis.reservas.common.dto.PagedResponse;
import com.lis.reservas.sancion.dto.LevantarSancionRequest;
import com.lis.reservas.sancion.dto.SancionCreateRequest;
import com.lis.reservas.sancion.dto.SancionResponse;
import com.lis.reservas.sancion.service.SancionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

/**
 * REST controller for the {@code /api/v1/sanciones} resource.
 *
 * <p>Access is split three ways and enforced in {@code SecurityConfig}:
 * writing is ADMIN-only, the staff listing is ADMIN or AUXILIAR, and
 * {@code GET /mias} is open to any authenticated user so a sanctioned
 * student can see why they were refused. The {@code /mias} matcher is
 * declared before the broad one, since the first match wins.
 */
@RestController
@RequestMapping("/api/v1/sanciones")
@RequiredArgsConstructor
public class SancionController {

    private final SancionService sancionService;

    /**
     * Raise a sanction. ADMIN only. Returns 201 + Location.
     */
    @Operation(summary = "Crear una sancion (ADMIN)")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Sancion creada"),
            @ApiResponse(responseCode = "400", description = "El usuario ya tiene una sancion vigente"),
            @ApiResponse(responseCode = "403", description = "Requiere rol ADMIN"),
            @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    })
    @PostMapping
    public ResponseEntity<SancionResponse> crear(@Valid @RequestBody SancionCreateRequest request) {
        SancionResponse creada = sancionService.crear(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequestUri()
                .path("/{id}")
                .buildAndExpand(creada.idSancion())
                .toUri();
        return ResponseEntity.created(location).body(creada);
    }

    /**
     * Paginated sanction listing. ADMIN or AUXILIAR.
     */
    @Operation(summary = "Listar sanciones con filtros (ADMIN / AUXILIAR)")
    @GetMapping
    public PagedResponse<SancionResponse> listar(
            @RequestParam(required = false) Integer idUsuario,
            @RequestParam(required = false) String estado,
            @RequestParam(defaultValue = "false") boolean soloVigentes,
            Pageable pageable) {
        return sancionService.buscar(idUsuario, estado, soloVigentes, pageable);
    }

    /**
     * The authenticated user's own sanctions, so a refused student can see
     * the reason and the end date without asking anyone.
     */
    @Operation(summary = "Sanciones del usuario autenticado")
    @GetMapping("/mias")
    public PagedResponse<SancionResponse> mias(Pageable pageable) {
        return sancionService.misSanciones(pageable);
    }

    /**
     * Lift a sanction early. ADMIN only.
     */
    @Operation(summary = "Levantar una sancion antes de su vencimiento (ADMIN)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Sancion levantada"),
            @ApiResponse(responseCode = "400", description = "La sancion ya estaba levantada"),
            @ApiResponse(responseCode = "403", description = "Requiere rol ADMIN"),
            @ApiResponse(responseCode = "404", description = "Sancion no encontrada")
    })
    @PatchMapping("/{id}/levantar")
    public SancionResponse levantar(@PathVariable Long id,
                                    @Valid @RequestBody(required = false)
                                    LevantarSancionRequest request) {
        return sancionService.levantar(id, request);
    }
}
