package com.github.cristianalvarez00.reservas_lis.controller;

import com.github.cristianalvarez00.reservas_lis.dto.EstudianteRequest;
import com.github.cristianalvarez00.reservas_lis.dto.EstudianteResponse;
import com.github.cristianalvarez00.reservas_lis.model.Estudiante;
import com.github.cristianalvarez00.reservas_lis.service.EstudianteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/*
CONTROLADOR DE ESTUDIANTES:
Aquí se encuentran los endpoints para registrar, listar y buscar estudiantes.
Los estudiantes son los usuarios que después pueden realizar reservas.
*/
@CrossOrigin(origins = "*") //Permitimos comunicacion con CORS
@RestController //Controlador
@RequestMapping("/estudiantes") //
public class EstudianteController {

    @Autowired
    private EstudianteService estudianteService;

    // POST /estudiantes: guarda un estudiante nuevo.
    @PostMapping
    public ResponseEntity<Estudiante> crear(@RequestBody EstudianteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(estudianteService.crearEstudiante(request));
    }

    // GET /estudiantes: devuelve todos los estudiantes registrados.
    @GetMapping
    public ResponseEntity<List<EstudianteResponse>> listar() {
        return ResponseEntity.ok(estudianteService.listarTodos());
    }

    // GET /estudiantes/estudiante/{id}: busca un estudiante específico por su id.
    @GetMapping("/estudiante/{id}")
    public ResponseEntity<Estudiante> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(estudianteService.obtenerPorId(id));
    }
}