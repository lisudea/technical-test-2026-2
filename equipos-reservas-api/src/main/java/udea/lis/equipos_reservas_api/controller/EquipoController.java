package udea.lis.equipos_reservas_api.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import udea.lis.equipos_reservas_api.dto.EquipoRequest;
import udea.lis.equipos_reservas_api.dto.EquipoResponse;
import udea.lis.equipos_reservas_api.dto.PageResponse;
import udea.lis.equipos_reservas_api.model.CategoriaEquipo;
import udea.lis.equipos_reservas_api.model.EstadoEquipo;
import udea.lis.equipos_reservas_api.service.EquipoService;

// Controlador REST para la gestión de equipos del laboratorio. Expone los endpoints de registro, actualización y
// consulta (individual y paginada con filtros) delegando la lógica de negocio al EquipoService.
@RestController
@RequestMapping("/api/equipos")
public class EquipoController {

    // Inyección de la dependencia del servicio de equipos para manejar la lógica de negocio relacionada con los equipos.
    private final EquipoService equipoService;

    public EquipoController(EquipoService equipoService) {
        this.equipoService = equipoService;
    }
    
    // Endpoint para registrar un nuevo equipo. Recibe un objeto EquipoRequest validado y devuelve un objeto EquipoResponse
    // con los datos del equipo registrado. Responde con HTTP 201 (CREATED).
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EquipoResponse registrar(@Valid @RequestBody EquipoRequest request) {
        return equipoService.registrar(request);
    }

    // Endpoint para actualizar un equipo existente. Recibe un objeto EquipoRequest validado y devuelve un objeto EquipoResponse
    // con los datos del equipo actualizado. 
    @PutMapping
    public EquipoResponse actualizar(@Valid @RequestBody EquipoRequest request) {
        return equipoService.actualizar(request);
    }

    // Endpoint para consultar un equipo por su id. Devuelve un objeto EquipoResponse con los datos del equipo.
    @GetMapping("/{id}")
    public EquipoResponse consultarPorId(@PathVariable Long id) {
        return equipoService.consultarPorId(id);
    }
    
    // Endpoint para listar los equipos de forma paginada, con la posibilidad de filtrar por categoría y estado.
    // Recibe parámetros opcionales de categoría y estado, así como parámetros de paginación (página y tamaño). 
    // Devuelve un objeto PageResponse con los datos de los equipos.
    @GetMapping
    public PageResponse<EquipoResponse> listar(
            @RequestParam(required = false) CategoriaEquipo categoria,
            @RequestParam(required = false) EstadoEquipo estado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        // Se limita la página a un valor mínimo de 0 y el tamaño a un rango entre 1 y 100.
        return equipoService.listarPaginado(categoria, estado, Math.max(page, 0), Math.min(Math.max(size, 1), 100));
    }
}
