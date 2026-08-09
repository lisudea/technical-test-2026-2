package udea.lis.equipos_reservas_api.mapper;

import org.springframework.stereotype.Component;
import udea.lis.equipos_reservas_api.dto.EquipoResponse;
import udea.lis.equipos_reservas_api.model.Equipo;

@Component // Esta anotación indica que la clase es un componente de Spring, lo que permite que sea detectada y gestionada 
// automáticamente por el contenedor de Spring. Esto facilita la inyección de dependencias y la reutilización del mapper en 
// otras partes de la aplicación.
public class EquipoMapper {

    // Este método convierte un objeto de tipo Equipo a un objeto de tipo EquipoResponse.
    // Se utiliza para mapear los datos de la entidad Equipo a un formato adecuado para la respuesta de la API, ocultando 
    // información sensible o innecesaria.
    // El método toma un objeto Equipo como parámetro y devuelve un objeto EquipoResponse con los atributos relevantes.
    // Se accede a los atributos del objeto Equipo mediante sus métodos getter y se pasan como argumentos al constructor 
    // de EquipoResponse. Esto permite que la API devuelva solo la información necesaria sobre el equipo, 
    // mejorando la seguridad y la eficiencia de la comunicación entre el servidor y el cliente.
    public EquipoResponse toResponse(Equipo equipo) {
        return new EquipoResponse(equipo.getId(), equipo.getNombre(), equipo.getNumeroSerie(),
                equipo.getCategoria(), equipo.getEstado());
    }
}
