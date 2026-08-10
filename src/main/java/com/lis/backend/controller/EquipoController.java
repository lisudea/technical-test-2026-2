package com.lis.backend.controller;

import com.lis.backend.dto.EquipoRequest;
import com.lis.backend.dto.EquipoResponse;
import com.lis.backend.entity.CategoriaEquipo;
import com.lis.backend.entity.EstadoEquipo;
import com.lis.backend.service.EquipoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/equipos")
@Tag(name = "Equipos", description = "Gestión del inventario de equipos del LIS")
@CrossOrigin
public class EquipoController {

    private final EquipoService service;

    public EquipoController(EquipoService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Registrar un equipo")
    public EquipoResponse crear(@Valid @RequestBody EquipoRequest request) {
        return service.crear(request);
    }

    @GetMapping
    @Operation(
            summary = "Listar equipos",
            description = "Consulta los equipos registrados. Permite buscar, filtrar por categoría y estado y utilizar paginación."
    )
    public Page<EquipoResponse> listar(

            @Parameter(description = "Texto para buscar por código, nombre o número de serie")
            @RequestParam(required = false) String search,

            @Parameter(description = "Categoría del equipo")
            @RequestParam(required = false) CategoriaEquipo categoria,

            @Parameter(description = "Estado administrativo del equipo")
            @RequestParam(required = false) EstadoEquipo estado,

            @Parameter(description = "Número de página. Empieza en 0.")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Cantidad de equipos por página")
            @RequestParam(defaultValue = "10") int size,

            @Parameter(description = "Campo por el cual ordenar")
            @RequestParam(defaultValue = "nombre") String sort
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(sort));

        return service.listar(
                search,
                categoria,
                estado,
                pageable
        );
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consultar un equipo por ID")
    public EquipoResponse obtener(@PathVariable Long id) {
        return service.obtener(id);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar un equipo")
    public EquipoResponse actualizar(
            @PathVariable Long id,
            @Valid @RequestBody EquipoRequest request
    ) {
        return service.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Eliminar un equipo sin historial de reservas")
    public void eliminar(@PathVariable Long id) {
        service.eliminar(id);
    }
}