package udea.lis.equipos_reservas_api.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

// Excepción personalizada para indicar que un recurso solicitado no se ha encontrado en el sistema.
// Al propagarse, Spring responde con HTTP 404 y el formato de error por defecto de Spring Boot.
@ResponseStatus(HttpStatus.NOT_FOUND)
public class RecursoNoEncontradoException extends RuntimeException {

    public RecursoNoEncontradoException(String mensaje) {
        super(mensaje);
    }
}
