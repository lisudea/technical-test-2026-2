package com.github.cristianalvarez00.reservas_lis.service;

import com.github.cristianalvarez00.reservas_lis.dto.ReservaRequest;
import com.github.cristianalvarez00.reservas_lis.dto.ReservaResponse;
import com.github.cristianalvarez00.reservas_lis.model.Equipo;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.github.cristianalvarez00.reservas_lis.model.Estudiante;
import com.github.cristianalvarez00.reservas_lis.model.Reserva;
import com.github.cristianalvarez00.reservas_lis.repository.EquipoRepository;
import com.github.cristianalvarez00.reservas_lis.repository.EstudianteRepository;
import com.github.cristianalvarez00.reservas_lis.repository.ReservaRepository;
import com.github.cristianalvarez00.reservas_lis.dto.EstadisticaEquipoResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.PageRequest;


/*
SERVICIO DE RESERVAS:
Aquí está la lógica principal de las reservas. Antes de guardar una nueva,
se validan las fechas, la existencia del estudiante y equipo, y especialmente
que el equipo no se encuentre reservado en esa misma franja horaria.
*/
@Service
public class ReservaService {

    @Autowired
    private ReservaRepository reservarepository;
    @Autowired
    private EstudianteRepository estudianteRepository;
    @Autowired
    private EquipoRepository equipoRepository;

    /*
    crearReserva(): primero valida que la fecha final sea realmente posterior
    a la inicial y que la reserva no se esté intentando hacer en el pasado.
    Después comprueba el traslape antes de guardar.
    */
    public ReservaResponse crearReserva(ReservaRequest request){

        // No se permite una reserva de duración cero ni una fecha final menor a la inicial.
        if (!request.getFechaFin().isAfter(request.getFechaInicio())) {
            throw new RuntimeException("La fecha de fin debe ser posterior a la fecha de inicio");
            }

        if (request.getFechaInicio().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("La fecha de inicio no puede estar en el pasado");
        }

        // Antes de crear la reserva se comprueba que ambos ids existan.
        Estudiante est = estudianteRepository.findById(request.getIdEstudiante()).orElseThrow(()-> new RuntimeException("Estudiante no encontrado"));
        Equipo equipo = equipoRepository.findById(request.getIdEquipo()).orElseThrow(()-> new RuntimeException("Equipo no encontrado"));
        // Se consulta si este mismo equipo ya está ocupado dentro del intervalo solicitado.
        boolean ocupado = reservarepository.existeTraslapeHorario(request.getIdEquipo(), request.getFechaInicio(), request.getFechaFin());
        if (ocupado) {
            throw new RuntimeException("El equipo esta reservado para los tiempos dados.");
        }
        // Si no hubo conflicto, se construye la reserva y se guarda.
        Reserva reserva = new Reserva();
        reserva.setEquipo(equipo);
        reserva.setEstudiante(est);
        reserva.setFechaInicio(request.getFechaInicio());
        reserva.setFechaFin(request.getFechaFin());

        Reserva guardada = reservarepository.save(reserva);

        // Finalmente se transforma lo guardado a la respuesta que recibe el cliente.
        ReservaResponse response = new ReservaResponse();
        response.setEquipo(guardada.getEquipo());
        response.setReservaId(guardada.getId());
        response.setEstudiante(guardada.getEstudiante());
        response.setFechaFin(guardada.getFechaFin());
        response.setFechaInicio(guardada.getFechaInicio());

        return response;
    }

    // Cancela la reserva. Antes se valida que el id realmente exista.
    public void eliminarReserva(Long id){
        if (!reservarepository.existsById(id)){
            throw new RuntimeException("La reserva no existe.");
        }
        reservarepository.deleteById(id);
    }

    // Lista las reservas de un estudiante y las convierte a ReservaResponse.
    public List<ReservaResponse> listarPorId(Long idEstudiante){
        if (!estudianteRepository.existsById(idEstudiante)) {
            throw new RuntimeException("El estudiante no existe");
        }
        // Se traen únicamente las reservas asociadas al id recibido.
        List<Reserva> reservas = reservarepository.findByEstudianteId(idEstudiante);

        List<ReservaResponse> listaResponse = new ArrayList<>();
        for (Reserva reserva : reservas){
            ReservaResponse response = new ReservaResponse();
            response.setEquipo(reserva.getEquipo());
            response.setEstudiante(reserva.getEstudiante());
            response.setFechaFin(reserva.getFechaFin());
            response.setFechaInicio(reserva.getFechaInicio());
            response.setReservaId(reserva.getId());
            listaResponse.add(response);
        }
        return listaResponse;
    }
    // Pide únicamente los primeros 5 resultados de la consulta estadística.
    public List<EstadisticaEquipoResponse> obtenerTopEquipos(){
        return reservarepository.obtenerTopEquipos(PageRequest.of(0, 5));
    }
}
