package udea.lis.equipos_reservas_api.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.http.converter.HttpMessageNotReadableException;

import java.time.LocalDateTime;
import java.util.List;

// Manejador global de excepciones que garantiza una respuesta de error uniforme para el frontend:
// {"status", "error", "message", "path", "timestamp"} y, en validaciones, una lista de errores por campo.
@RestControllerAdvice // Esta anotación indica que esta clase manejará excepciones de manera global para todos los 
// controladores REST de la aplicación. 
public class GlobalExceptionHandler {

    // Cuerpo estándar de la respuesta de error que recibe el frontend.
    public static class ApiError {
        private int status;
        private String error;
        private String message;
        private String path;
        private LocalDateTime timestamp;
        private List<CampoError> errors;

        public ApiError() {
        }

        public ApiError(int status, String error, String message, String path, List<CampoError> errors) {
            this.status = status;
            this.error = error;
            this.message = message;
            this.path = path;
            this.timestamp = LocalDateTime.now();
            this.errors = errors;
        }

        public int getStatus() {
            return status;
        }

        public void setStatus(int status) {
            this.status = status;
        }

        public String getError() {
            return error;
        }

        public void setError(String error) {
            this.error = error;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public String getPath() {
            return path;
        }

        public void setPath(String path) {
            this.path = path;
        }

        public LocalDateTime getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
        }

        public List<CampoError> getErrors() {
            return errors;
        }

        public void setErrors(List<CampoError> errors) {
            this.errors = errors;
        }
    }

    // Error asociado a un campo específico en las validaciones de entrada (HTTP 400).
    public static class CampoError {
        private String campo;
        private String mensaje;

        public CampoError() {
        }

        public CampoError(String campo, String mensaje) {
            this.campo = campo;
            this.mensaje = mensaje;
        }

        public String getCampo() {
            return campo;
        }

        public void setCampo(String campo) {
            this.campo = campo;
        }

        public String getMensaje() {
            return mensaje;
        }

        public void setMensaje(String mensaje) {
            this.mensaje = mensaje;
        }
    }

    @ExceptionHandler(RecursoNoEncontradoException.class) // Maneja la excepción personalizada RecursoNoEncontradoException y 
    // devuelve una respuesta con HTTP 404.
    public ResponseEntity<ApiError> recursoNoEncontrado(RecursoNoEncontradoException ex, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, ex.getMessage(), request, null);
    }
    // Maneja las excepciones de conflicto (RecursoDuplicadoException y ConflictoReservaException) y devuelve una respuesta 
    // con HTTP 409.
    @ExceptionHandler({RecursoDuplicadoException.class, ConflictoReservaException.class})
    public ResponseEntity<ApiError> conflicto(RuntimeException ex, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, ex.getMessage(), request, null);
    }

    // Errores de validación de beans (@Valid): se reporta un error por cada campo rechazado.
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> validacion(MethodArgumentNotValidException ex, HttpServletRequest request) {
        List<CampoError> errores = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> new CampoError(error.getField(), error.getDefaultMessage()))
                .toList();
        return build(HttpStatus.BAD_REQUEST, "Los datos enviados no son válidos", request, errores);
    }

    // Body mal formado o con valores no permitidos (JSON inválido, enum inexistente, fechas mal formateadas).
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> mensajeNoLegible(HttpMessageNotReadableException ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "El cuerpo de la solicitud es inválido o contiene valores no permitidos",
                request, null);
    }

    // Parámetros de query con valores no permitidos (ej. enum inválido en ?estado=INEXISTENTE).
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> tipoInvalido(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "El parámetro '" + ex.getName() + "' no es válido", request, null);
    }

    // Cualquier error no contemplado: se devuelve 500 sin exponer detalles internos.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> errorGeneral(Exception ex, HttpServletRequest request) {
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Ocurrió un error inesperado en el servidor", request, null);
    }

    // Método auxiliar para construir la respuesta de error con el formato estándar definido en ApiError.
    private ResponseEntity<ApiError> build(HttpStatus status, String message, HttpServletRequest request,
                                           List<CampoError> errors) {
        ApiError body = new ApiError(status.value(), status.getReasonPhrase(), message,
                request.getRequestURI(), errors);
        return ResponseEntity.status(status).body(body);
    }
}
