package com.github.cristianalvarez00.reservas_lis.controller;

import com.github.cristianalvarez00.reservas_lis.dto.EquipoRequest;
import com.github.cristianalvarez00.reservas_lis.dto.EquipoResponse;
import com.github.cristianalvarez00.reservas_lis.enums.CategoriaEquipo;
import com.github.cristianalvarez00.reservas_lis.enums.EstadoEquipo;
import com.github.cristianalvarez00.reservas_lis.service.EquipoService;
import org.springframework.data.domain.Page;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/*
CONTROLADOR DE EQUIPOS:
Recibe las peticiones relacionadas con los equipos del laboratorio.
La lógica se deja en EquipoService y desde aquí solamente se reciben los datos
y se devuelve la respuesta correspondiente.
*/
@RestController
@RequestMapping("/equipos")
@CrossOrigin(origins = "*")
public class EquipoController {

    @Autowired
    private EquipoService equipoService;

    // POST /equipos: registra un equipo nuevo.
    @PostMapping
    public ResponseEntity<EquipoResponse> registrar(@RequestBody EquipoRequest request){
        return ResponseEntity.status(HttpStatus.CREATED).body(equipoService.registrarEquipo(request));
    }
    // GET /equipos: lista de forma paginada y permite filtrar por categoria o estado.
    @GetMapping
    public ResponseEntity<Page<EquipoResponse>> listar(
            @RequestParam(required = false) CategoriaEquipo categoria,
            @RequestParam(required = false) EstadoEquipo estado,
            @RequestParam(defaultValue = "0") int pag,
            @RequestParam(defaultValue = "10") int size
            ){

        Page<EquipoResponse>equipos = equipoService.listarEquipos(categoria,estado,pag,size);
        return ResponseEntity.ok(equipos);
    }
    // PUT /equipos/{idEquipo}/{estadoNuevo}: cambia el estado actual de un equipo.
    @PutMapping("/{idEquipo}/{estadoNuevo}")
    public ResponseEntity<EquipoResponse> actualizar(@PathVariable Long idEquipo, @PathVariable EstadoEquipo estadoNuevo){
        return ResponseEntity.ok(equipoService.actualizarEstado(idEquipo, estadoNuevo));
    }
}
