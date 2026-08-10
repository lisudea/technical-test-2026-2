package com.github.cristianalvarez00.reservas_lis.service;


import com.github.cristianalvarez00.reservas_lis.dto.EquipoRequest;
import com.github.cristianalvarez00.reservas_lis.dto.EquipoResponse;
import com.github.cristianalvarez00.reservas_lis.enums.CategoriaEquipo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.github.cristianalvarez00.reservas_lis.enums.EstadoEquipo;
import com.github.cristianalvarez00.reservas_lis.model.Equipo;
import com.github.cristianalvarez00.reservas_lis.repository.EquipoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/*
SERVICIO DE EQUIPOS:
Aquí se encuentra la lógica para registrar, actualizar y listar equipos.
Antes de guardar se revisan los datos obligatorios y que el numero de serie no esté repetido.
*/
@Service

public class EquipoService {

    @Autowired
    private EquipoRepository equipoRepository;

    /*
    registrarEquipo(): valida los datos recibidos, crea la entidad y finalmente
    devuelve un EquipoResponse con lo que se guardó.
    */
    public EquipoResponse registrarEquipo(EquipoRequest request){

        // Primero se revisan los campos necesarios antes de intentar guardar.
        if (request.getNombre() == null || request.getNombre().isBlank()){
            throw new RuntimeException("El nombre no puede ser vacio.");
        }
        if (request.getCategoriaEquipo() == null){
            throw new RuntimeException("Categoria no puede ser vacio");
        }
        if (request.getEstadoEquipo()==null){
            throw new RuntimeException("Estado no puede ser vacio");
        }
        if (request.getNumSerie() == null || request.getNumSerie().isBlank()){
            throw new RuntimeException("numero de serie no puede ser vacio");

        }
        if (equipoRepository.findByNumSerie(request.getNumSerie()).isPresent()){
            throw new RuntimeException("El equipo ya esta registrado.");
        }

        // Después de validar se construye la entidad con los datos del request.
        Equipo equipo = new Equipo();
        equipo.setCategoria(request.getCategoriaEquipo());
        equipo.setEstado(request.getEstadoEquipo());
        equipo.setNombre(request.getNombre());
        equipo.setNumSerie(request.getNumSerie());

        // Se guarda y luego se arma la respuesta con los datos que quedaron en base de datos.
        Equipo guardado = equipoRepository.save(equipo);
        EquipoResponse response = new EquipoResponse();
        response.setCategoria(guardado.getCategoria());
        response.setEquipoId(guardado.getId());
        response.setEstado(guardado.getEstado());
        response.setNumSerie(guardado.getNumSerie());
        response.setNombre(guardado.getNombre());

        return response;

    }
    /*
    actualizarEstado(): busca el equipo por id y reemplaza solamente su estado.
    */
    public EquipoResponse actualizarEstado(Long idEquipo, EstadoEquipo estadoNuevo){

        Equipo equipo = equipoRepository.findById(idEquipo).orElseThrow(()-> new RuntimeException("El equipo con id solicitado no existe."));
        if (estadoNuevo == null){
            throw new RuntimeException("El estado nuevo no puede ser null");
        }
        equipo.setEstado(estadoNuevo);

        Equipo actualizado = equipoRepository.save(equipo);
        EquipoResponse response = new EquipoResponse();
        response.setNumSerie(actualizado.getNumSerie());
        response.setEstado(actualizado.getEstado());
        response.setCategoria(actualizado.getCategoria());
        response.setEquipoId(actualizado.getId());
        response.setNombre(actualizado.getNombre());

        return response;

    }
    /*
    listarEquipos(): construye la paginación y decide qué consulta realizar.
    Si llega estado se filtra por estado, si llega categoria se filtra por categoria,
    y si no llega ninguno se listan todos.
    */
    public Page<EquipoResponse> listarEquipos(CategoriaEquipo categoria, EstadoEquipo estado, int pag, int size){

        // PageRequest indica qué página se quiere consultar y cuántos registros debe traer.
        Pageable pageable = PageRequest.of(pag, size);
        Page<Equipo> equiposPage;

        if (estado !=null){
            equiposPage = equipoRepository.findByEstado(estado, pageable);
        } else if (categoria!=null) {
            equiposPage = equipoRepository.findByCategoria(categoria, pageable);
        } else{
            equiposPage = equipoRepository.findAll(pageable);
        }

        Page<EquipoResponse> responses = equiposPage.map(equipo -> {
            EquipoResponse response = new EquipoResponse();
            response.setNombre(equipo.getNombre());
            response.setCategoria(equipo.getCategoria());
            response.setEstado(equipo.getEstado());
            response.setNumSerie(equipo.getNumSerie());
            response.setEquipoId(equipo.getId());
            return response;
        });
        return responses;
    }
}
