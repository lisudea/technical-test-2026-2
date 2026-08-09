package udea.lis.equipos_reservas_api.service;

// Se importan las clases necesarias para el servicio de equipos, incluyendo repositorios, DTOs, mapeadores y utilidades de Spring.
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import udea.lis.equipos_reservas_api.dto.EquipoRequest;
import udea.lis.equipos_reservas_api.dto.EquipoResponse;
import udea.lis.equipos_reservas_api.dto.PageResponse;
import udea.lis.equipos_reservas_api.exception.RecursoDuplicadoException;
import udea.lis.equipos_reservas_api.exception.RecursoNoEncontradoException;
import udea.lis.equipos_reservas_api.mapper.EquipoMapper;
import udea.lis.equipos_reservas_api.model.CategoriaEquipo;
import udea.lis.equipos_reservas_api.model.Equipo;
import udea.lis.equipos_reservas_api.model.EstadoEquipo;
import udea.lis.equipos_reservas_api.repository.EquipoRepository;

@Service // Esta anotación indica que la clase es un servicio de Spring, lo que permite que sea detectada y gestionada automáticamente
// por el contenedor de Spring. Esto facilita la inyección de dependencias y la reutilización del servicio en otras partes de la aplicación.

public class EquipoService {
    
    // Se definen los repositorios y el mapper que se utilizarán en el servicio de equipos. Estos componentes se inyectan a 
    // través del constructor, lo que permite que el servicio acceda a la base de datos y realice operaciones de mapeo entre 
    // entidades y DTOs.
    private final EquipoRepository equipoRepository;
    private final EquipoMapper equipoMapper;

    // Constructor del servicio de equipos, que recibe los repositorios y el mapper como parámetros.
    public EquipoService(EquipoRepository equipoRepository, EquipoMapper equipoMapper) {
        this.equipoRepository = equipoRepository;
        this.equipoMapper = equipoMapper;
    }
    // Este método registra un nuevo equipo en la base de datos a partir de un objeto EquipoRequest.
    // Primero, verifica si ya existe un equipo con el mismo id o número de serie.
    // Si existe, lanza una excepción indicando que el recurso ya existe. Si no existe, crea un nuevo objeto Equipo con 
    // los datos proporcionados en la solicitud y lo guarda en la base de datos. Finalmente, devuelve un objeto EquipoResponse 
    // con los datos del equipo registrado.
    public EquipoResponse registrar(EquipoRequest request) {
        if (equipoRepository.existsById(request.getId())) {
            throw new RecursoDuplicadoException("Ya existe un equipo con el id " + request.getId());
        }
        if (equipoRepository.existsByNumeroSerie(request.getNumeroSerie())) {
            throw new RecursoDuplicadoException("Ya existe un equipo con el número de serie " + request.getNumeroSerie());
        }
        Equipo equipo = new Equipo(request.getNombre(), request.getNumeroSerie(), request.getCategoria(), request.getEstado());
        equipo.setId(request.getId());
        return equipoMapper.toResponse(equipoRepository.save(equipo));
    }

    // Este método actualiza los datos de un equipo existente en la base de datos a partir de un objeto EquipoRequest.
    // Primero, busca el equipo por su id. Si no se encuentra, lanza una excepción indicando que el recurso no existe. 
    // Luego, verifica si el número de serie proporcionado es diferente del actual y si ya existe otro equipo con ese número 
    // de serie. Si existe, lanza una excepción indicando que el recurso ya existe. Si no existe, actualiza los atributos del equipo
    // con los datos proporcionados en la solicitud y lo guarda en la base de datos.
    public EquipoResponse actualizar(EquipoRequest request) {
        Equipo equipo = buscarEquipo(request.getId());
        if (!equipo.getNumeroSerie().equals(request.getNumeroSerie())
                && equipoRepository.existsByNumeroSerie(request.getNumeroSerie())) {
            throw new RecursoDuplicadoException("Ya existe un equipo con el número de serie " + request.getNumeroSerie());
        }
        equipo.setNombre(request.getNombre());
        equipo.setNumeroSerie(request.getNumeroSerie());
        equipo.setCategoria(request.getCategoria());
        equipo.setEstado(request.getEstado());
        return equipoMapper.toResponse(equipoRepository.save(equipo));
    }

    // Este método consulta un equipo por su id y devuelve un objeto EquipoResponse con los datos del equipo.
    public EquipoResponse consultarPorId(Long id) {
        return equipoMapper.toResponse(buscarEquipo(id));
    }

    // Este método lista los equipos de forma paginada, filtrando por categoría y estado si se proporcionan. 
    public PageResponse<EquipoResponse> listarPaginado(CategoriaEquipo categoria, EstadoEquipo estado, int pagina, int tamano) {
        Pageable pageable = PageRequest.of(pagina, tamano);
        Page<Equipo> page;
        if (categoria != null && estado != null) {
            page = equipoRepository.findByCategoriaAndEstado(categoria, estado, pageable);
        } else if (categoria != null) {
            page = equipoRepository.findByCategoria(categoria, pageable);
        } else if (estado != null) {
            page = equipoRepository.findByEstado(estado, pageable);
        } else {
            page = equipoRepository.findAll(pageable);
        }
        return PageResponse.from(page, equipoMapper::toResponse);
    }

    // Este método busca un equipo por su id. Si no se encuentra, lanza una excepción indicando que el recurso no existe.
    private Equipo buscarEquipo(Long id) {
        return equipoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Equipo no encontrado con id " + id));
    }
}
