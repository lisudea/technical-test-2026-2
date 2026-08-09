package udea.lis.equipos_reservas_api.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

// Excepción personalizada para indicar un conflicto en la reserva de un equipo.
// Al propagarse, Spring responde con HTTP 409 y el formato de error por defecto de Spring Boot.
@ResponseStatus(HttpStatus.CONFLICT)
public class ConflictoReservaException extends RuntimeException {

    public ConflictoReservaException(String mensaje) {
        super(mensaje);
    }
}
