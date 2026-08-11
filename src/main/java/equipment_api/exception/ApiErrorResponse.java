package equipment_api.exception;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Cuerpo unico para TODAS las respuestas de error de la API.
 *
 * Tener un solo contrato permite al frontend escribir un unico parser: lee
 * `message` para el aviso al usuario y `errors` para pintar los fallos campo a
 * campo en los formularios.
 *
 * `code` es un identificador estable y legible por maquina. Existe porque el
 * codigo HTTP no siempre basta: dos situaciones muy distintas (la franja esta
 * ocupada / el equipo esta en mantenimiento) comparten el 409, y el frontend
 * necesita distinguirlas para mostrar el mensaje correcto SIN tener que
 * interpretar el texto, que cambia con el idioma.
 */
public class ApiErrorResponse {

    private final LocalDateTime timestamp = LocalDateTime.now();
    private final int status;
    private final String error;
    /** Identificador estable de la situacion. Ver {@link ErrorCode}. */
    private final String code;
    private final String message;
    private final String path;
    private final List<FieldErrorDetail> errors;

    public ApiErrorResponse(int status, String error, String code, String message, String path) {
        this(status, error, code, message, path, List.of());
    }

    public ApiErrorResponse(int status, String error, String code, String message, String path,
                            List<FieldErrorDetail> errors) {
        this.status = status;
        this.error = error;
        this.code = code;
        this.message = message;
        this.path = path;
        this.errors = errors;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public int getStatus() {
        return status;
    }

    public String getError() {
        return error;
    }

    public String getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }

    public String getPath() {
        return path;
    }

    public List<FieldErrorDetail> getErrors() {
        return errors;
    }

    /** Detalle de un fallo de validacion sobre un campo concreto. */
    public static class FieldErrorDetail {

        private final String field;
        private final String message;

        public FieldErrorDetail(String field, String message) {
            this.field = field;
            this.message = message;
        }

        public String getField() {
            return field;
        }

        public String getMessage() {
            return message;
        }
    }
}