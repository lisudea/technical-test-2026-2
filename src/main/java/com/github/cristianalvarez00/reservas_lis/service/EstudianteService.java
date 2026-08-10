package com.github.cristianalvarez00.reservas_lis.service;

import com.github.cristianalvarez00.reservas_lis.dto.EstudianteRequest;
import com.github.cristianalvarez00.reservas_lis.dto.EstudianteResponse;
import com.github.cristianalvarez00.reservas_lis.model.Estudiante;
import com.github.cristianalvarez00.reservas_lis.repository.EstudianteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/*
SERVICIO DE ESTUDIANTES:
Se encarga de registrar estudiantes, listar los existentes y buscar uno por id.
*/
@Service
public class EstudianteService {

    @Autowired
    private EstudianteRepository estudianteRepository;

    // Crea un estudiante con los datos recibidos y lo guarda en la base de datos.
    public Estudiante crearEstudiante(EstudianteRequest request) {
        // Se pasa la información del request a la entidad que se va a guardar.
        Estudiante est = new Estudiante();
        est.setNombre(request.getNombre());
        est.setCorreo(request.getCorreo());
        return estudianteRepository.save(est);
    }

    // Recorre los estudiantes y los convierte a la respuesta que usa la API.
    public List<EstudianteResponse> listarTodos() {
        // La lista se devuelve usando EstudianteResponse y no directamente con la entidad.
        List<EstudianteResponse> responses = new ArrayList<>();
       for (Estudiante est : estudianteRepository.findAll()){
           EstudianteResponse response = new EstudianteResponse();
           response.setCorreo(est.getCorreo());
           response.setId(est.getId());
           response.setNombre(est.getNombre());
           responses.add(response);
       }
       return responses;
    }

    // Busca un estudiante por id. Si no existe se devuelve un error.
    public Estudiante obtenerPorId(Long id) {
        return estudianteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Estudiante no encontrado"));
    }
}