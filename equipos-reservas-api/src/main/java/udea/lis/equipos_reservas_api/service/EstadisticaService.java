package udea.lis.equipos_reservas_api.service;

// Se importan las clases necesarias para el servicio de estadísticas, incluyendo repositorios, DTOs y utilidades de Spring.
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import udea.lis.equipos_reservas_api.dto.TopEquipoResponse;
import udea.lis.equipos_reservas_api.repository.EquipoRepository;
import udea.lis.equipos_reservas_api.repository.ReservaRepository;

import java.util.ArrayList;
import java.util.List;

@Service // Esta anotación indica que la clase es un servicio de Spring, lo que permite que sea detectada y gestionada 
// automáticamente por el contenedor de Spring. Esto facilita la inyección de dependencias y la reutilización del servicio en 
// otras partes de la aplicación.
public class EstadisticaService {

    // Se definen los repositorios que se utilizarán en el servicio de estadísticas. Estos componentes se inyectan a través
    // del constructor, lo que permite que el servicio acceda a la base de datos y realice operaciones de consulta.
    private final ReservaRepository reservaRepository;
    private final EquipoRepository equipoRepository;

    public EstadisticaService(ReservaRepository reservaRepository, EquipoRepository equipoRepository) {
        this.reservaRepository = reservaRepository;
        this.equipoRepository = equipoRepository;
    }

    // Este método obtiene los 5 equipos más solicitados, basándose en la cantidad de reservas asociadas a cada uno.
    // Se utiliza un Pageable para limitar los resultados a los primeros 5, y se consulta el repositorio de reservas
    // para obtener los datos necesarios. Luego, se procesan los resultados y se convierten en objetos TopEquipoResponse.
    public List<TopEquipoResponse> top5EquiposMasSolicitados() {
        Pageable limite = PageRequest.of(0, 5);
        List<Object[]> resultados = reservaRepository.findEquiposMasSolicitados(limite);
        List<TopEquipoResponse> top = new ArrayList<>();
        for (Object[] resultado : resultados) {
            Long equipoId = (Long) resultado[0];
            Long cantidad = (Long) resultado[1];
            equipoRepository.findById(equipoId).ifPresent(equipo ->
                    top.add(new TopEquipoResponse(equipoId, equipo.getNombre(), cantidad)));
        }
        return top;
    }
}
