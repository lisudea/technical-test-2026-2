package udea.lis.equipos_reservas_api.mapper;

import org.springframework.stereotype.Component;
import udea.lis.equipos_reservas_api.dto.ReservaResponse;
import udea.lis.equipos_reservas_api.model.Equipo;
import udea.lis.equipos_reservas_api.model.Reserva;
import udea.lis.equipos_reservas_api.model.Usuario;

@Component // Esta anotación indica que la clase es un componente de Spring, lo que permite que sea detectada y gestionada 
// automáticamente por el contenedor de Spring. Esto facilita la inyección de dependencias y la reutilización del mapper en otras 
// partes de la aplicación.
public class ReservaMapper {

    // Este método convierte un objeto de tipo Reserva a un objeto de tipo ReservaResponse.
    // Se utiliza para mapear los datos de la entidad Reserva a un formato adecuado para la respuesta de la API, ocultando 
    // información sensible o innecesaria. El método toma un objeto Reserva como parámetro y devuelve un objeto ReservaResponse 
    // con los atributos relevantes.  Se accede a los atributos del objeto Reserva mediante sus métodos getter y se pasan como
    // argumentos al constructor de ReservaResponse.
    public ReservaResponse toResponse(Reserva reserva) {
        Equipo equipo = reserva.getEquipo();
        Usuario usuario = reserva.getUsuario();
        return new ReservaResponse(
                reserva.getId(),
                reserva.getFechaReserva(),
                reserva.getFechaDevolucion(),
                reserva.getEstado(),
                new ReservaResponse.EquipoResumen(equipo.getId(), equipo.getNombre()),
                new ReservaResponse.UsuarioResumen(usuario.getNombre(), usuario.getCorreo()));
    }
}
