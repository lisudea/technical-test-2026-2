package udea.lis.equipos_reservas_api.service;
// Importamos las clases necesarias para el funcionamiento del servicio de reservas, incluyendo repositorios, modelos, DTOs 
// y excepciones.
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import udea.lis.equipos_reservas_api.dto.PageResponse;
import udea.lis.equipos_reservas_api.dto.ReservaRequest;
import udea.lis.equipos_reservas_api.dto.ReservaResponse;
import udea.lis.equipos_reservas_api.exception.ConflictoReservaException;
import udea.lis.equipos_reservas_api.exception.RecursoNoEncontradoException;
import udea.lis.equipos_reservas_api.mapper.ReservaMapper;
import udea.lis.equipos_reservas_api.model.Equipo;
import udea.lis.equipos_reservas_api.model.EstadoEquipo;
import udea.lis.equipos_reservas_api.model.EstadoReserva;
import udea.lis.equipos_reservas_api.model.Reserva;
import udea.lis.equipos_reservas_api.model.Usuario;
import udea.lis.equipos_reservas_api.repository.EquipoRepository;
import udea.lis.equipos_reservas_api.repository.ReservaRepository;
import udea.lis.equipos_reservas_api.repository.UsuarioRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service // Esta anotación indica que la clase es un servicio de Spring, lo que permite que sea detectada y gestionada 
// automáticamente por el contenedor de Spring. Esto facilita la inyección de dependencias y la reutilización del servicio en otras
// partes de la aplicación.
public class ReservaService {

    // Se definen los repositorios y el mapper que se utilizarán en el servicio de reservas. Estos componentes se inyectan a 
    // través del constructor, lo que permite que el servicio acceda a la base de datos y realice operaciones de mapeo entre 
    // entidades y DTOs.
    private final ReservaRepository reservaRepository;
    private final EquipoRepository equipoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ReservaMapper reservaMapper;

    // Constructor del servicio de reservas, que recibe los repositorios y el mapper como parámetros. 
    public ReservaService(ReservaRepository reservaRepository, EquipoRepository equipoRepository,
                          UsuarioRepository usuarioRepository, ReservaMapper reservaMapper) {
        this.reservaRepository = reservaRepository;
        this.equipoRepository = equipoRepository;
        this.usuarioRepository = usuarioRepository;
        this.reservaMapper = reservaMapper;
    }

    @Transactional // Esta anotación indica que el método se ejecutará dentro de una transacción de base de datos. Si ocurre algún
    //  error, la transacción se revertirá automáticamente.

    // Este método crea una nueva reserva a partir de un objeto ReservaRequest. Primero, busca o crea un usuario en la 
    // base de datos según el correo proporcionado. Luego, busca el equipo correspondiente al id proporcionado y valida su 
    // disponibilidad.
    public ReservaResponse crearReserva(ReservaRequest request) {
        // Se busca un usuario por su correo electrónico. Si no se encuentra, se crea un nuevo usuario con el nombre y correo proporcionados 
        // en la solicitud. Esto asegura que siempre haya un usuario asociado a la reserva.
        Usuario usuario = usuarioRepository.findByCorreo(request.getCorreoUsuario())
                .orElseGet(() -> usuarioRepository.save(
                        new Usuario(request.getNombreUsuario(), request.getCorreoUsuario())));
        // Se busca un equipo por su id. Si no se encuentra, se lanza una excepción indicando que el equipo no existe.
        Equipo equipo = equipoRepository.findById(request.getEquipoId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Equipo no encontrado con id " + request.getEquipoId()));
        // Se valida que el equipo esté disponible para la reserva. Si no lo está, se lanza una excepción indicando el conflicto.
        validarDisponibilidadEquipo(equipo);
        
        // Se obtienen las fechas de inicio y fin de la reserva desde la solicitud. Se valida que la fecha de devolución sea 
        // posterior a la fecha de inicio.
        LocalDateTime inicio = request.getFechaReserva();
        LocalDateTime fin = request.getFechaDevolucion();
        if (!fin.isAfter(inicio)) {
            throw new ConflictoReservaException("La fecha de devolución debe ser posterior a la fecha de inicio de la reserva");
        }

        // Se buscan las reservas existentes que entren en conflicto con la nueva reserva. Si se encuentran, 
        // se lanza una excepción.
        List<Reserva> conflictos = reservaRepository.findConflictos(equipo.getId(), inicio, fin);
        if (!conflictos.isEmpty()) {
            throw new ConflictoReservaException("El equipo " + equipo.getNombre()
                    + " ya está reservado en el horario solicitado");
        }

        // Se crea una nueva reserva y se guarda en la base de datos. Luego, se actualiza el estado del equipo a "RESERVADO" y se 
        // guarda nuevamente en la base de datos. Finalmente, se devuelve la respuesta de la reserva creada.
        Reserva reserva = new Reserva(inicio, fin, usuario, equipo);
        reserva = reservaRepository.save(reserva);

        equipo.setEstado(EstadoEquipo.RESERVADO);
        equipoRepository.save(equipo);

        return reservaMapper.toResponse(reserva);
    }

    @Transactional 
    public ReservaResponse cancelarReserva(Long id) {
        // Se busca una reserva por su id. Si no se encuentra, se lanza una excepción indicando que la reserva no existe.
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Reserva no encontrada con id " + id));
        if (reserva.getEstado() == EstadoReserva.CANCELADA) {
            throw new ConflictoReservaException("La reserva " + id + " ya está cancelada");
        }
        // Se cambia el estado de la reserva a "CANCELADA" y se guarda en la base de datos. Luego, se verifica si el equipo 
        // asociado tiene otras reservas activas. Si no las tiene, se cambia el estado del equipo a "DISPONIBLE" y se guarda en la
        // base de datos. Finalmente, se devuelve la respuesta de la reserva cancelada.
        reserva.setEstado(EstadoReserva.CANCELADA);
        reservaRepository.save(reserva);

        Equipo equipo = reserva.getEquipo();
        boolean tieneOtrasActivas = reservaRepository.findByEquipoId(equipo.getId()).stream()
                .anyMatch(r -> r.getEstado() == EstadoReserva.ACTIVA);
        if (!tieneOtrasActivas) {
            equipo.setEstado(EstadoEquipo.DISPONIBLE);
            equipoRepository.save(equipo);
        }

        return reservaMapper.toResponse(reserva);
    }

    // Este método lista las reservas según los filtros proporcionados (equipoId y estado) y devuelve una respuesta paginada.
    // Se utiliza Pageable para controlar la paginación y se construye un PageResponse a partir de la página de reservas obtenida
    // y el mapper para convertir las reservas a respuestas.
    public PageResponse<ReservaResponse> listarReservas(Long equipoId, EstadoReserva estado, int pagina, int tamano) {
        Pageable pageable = PageRequest.of(pagina, tamano);
        Page<Reserva> page;
        if (equipoId != null && estado != null) {
            page = reservaRepository.findByEquipoIdAndEstado(equipoId, estado, pageable);
        } else if (equipoId != null) {
            page = reservaRepository.findByEquipoId(equipoId, pageable);
        } else if (estado != null) {
            page = reservaRepository.findByEstado(estado, pageable);
        } else {
            page = reservaRepository.findAll(pageable);
        }
        return PageResponse.from(page, reservaMapper::toResponse);
    }

    // Este método valida la disponibilidad de un equipo antes de crear una reserva. Si el estado del equipo no es "DISPONIBLE",
    // se lanza una excepción indicando que el equipo no está disponible para la reserva.
    private void validarDisponibilidadEquipo(Equipo equipo) {
        if (equipo.getEstado() != EstadoEquipo.DISPONIBLE) {
            throw new ConflictoReservaException("El equipo " + equipo.getNombre()
                    + " no está disponible (estado actual: " + equipo.getEstado() + ")");
        }
    }
}
