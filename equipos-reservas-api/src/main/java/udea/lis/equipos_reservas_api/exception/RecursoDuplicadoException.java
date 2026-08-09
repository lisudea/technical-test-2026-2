package udea.lis.equipos_reservas_api.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

// Excepción personalizada para indicar que se ha intentado crear un recurso que ya existe en el sistema.
// Al propagarse, Spring responde con HTTP 409 y el formato de error por defecto de Spring Boot.
@ResponseStatus(HttpStatus.CONFLICT)
public class RecursoDuplicadoException extends RuntimeException {

    public RecursoDuplicadoException(String mensaje) {
        super(mensaje);
    }
}
