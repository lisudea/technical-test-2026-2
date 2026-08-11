package equipment_api.exception;

import jakarta.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.ErrorResponseException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ------------------------------------------------------------------
    // 404 - Recurso no encontrado
    // ------------------------------------------------------------------

    @ExceptionHandler(EquipmentNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleEquipmentNotFound(
            EquipmentNotFoundException exception, HttpServletRequest request) {

        return build(HttpStatus.NOT_FOUND, ErrorCode.EQUIPMENT_NOT_FOUND, exception.getMessage(), request);
    }

    @ExceptionHandler(ReservationNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleReservationNotFound(
            ReservationNotFoundException exception, HttpServletRequest request) {

        return build(HttpStatus.NOT_FOUND, ErrorCode.RESERVATION_NOT_FOUND, exception.getMessage(), request);
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleUserNotFound(
            UserNotFoundException exception, HttpServletRequest request) {

        return build(HttpStatus.NOT_FOUND, ErrorCode.USER_NOT_FOUND, exception.getMessage(), request);
    }

    // ------------------------------------------------------------------
    // 409 - Conflicto con el estado actual del recurso
    // ------------------------------------------------------------------

    /** REGLA DE NEGOCIO CRITICA: la franja horaria ya esta ocupada. */
    @ExceptionHandler(ReservationConflictException.class)
    public ResponseEntity<ApiErrorResponse> handleReservationConflict(
            ReservationConflictException exception, HttpServletRequest request) {

        return build(HttpStatus.CONFLICT, ErrorCode.RESERVATION_OVERLAP, exception.getMessage(), request);
    }

    /** El equipo esta en mantenimiento: mismo 409, distinto `code`. */
    @ExceptionHandler(EquipmentNotAvailableException.class)
    public ResponseEntity<ApiErrorResponse> handleEquipmentNotAvailable(
            EquipmentNotAvailableException exception, HttpServletRequest request) {

        return build(HttpStatus.CONFLICT, ErrorCode.EQUIPMENT_IN_MAINTENANCE, exception.getMessage(), request);
    }

    /**
     * 409 tambien para violaciones de unicidad en base de datos, tipicamente un
     * `serialNumber` de equipo repetido. Sin este manejador saldria un 500.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleDataIntegrity(
            DataIntegrityViolationException exception, HttpServletRequest request) {

        log.warn("Violacion de integridad en {}: {}", request.getRequestURI(),
                exception.getMostSpecificCause().getMessage());

        return build(
                HttpStatus.CONFLICT,
                ErrorCode.DUPLICATE_RESOURCE,
                "Ya existe un registro con esos datos. Revisa que el numero de serie no este repetido.",
                request
        );
    }

    // ------------------------------------------------------------------
    // 400 - Peticion invalida
    // ------------------------------------------------------------------

    /**
     * Errores de @Valid. Antes no estaba cubierto y Spring devolvia un
     * ProblemDetail con un formato distinto al del resto de la API.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(
            MethodArgumentNotValidException exception, HttpServletRequest request) {

        List<ApiErrorResponse.FieldErrorDetail> fieldErrors = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> new ApiErrorResponse.FieldErrorDetail(
                        error.getField(),
                        error.getDefaultMessage()
                ))
                .toList();

        ApiErrorResponse body = new ApiErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                ErrorCode.VALIDATION_FAILED,
                "Hay campos invalidos en la peticion",
                request.getRequestURI(),
                fieldErrors
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /** Reglas de negocio de la reserva: rango, duracion o identificacion. */
    @ExceptionHandler(InvalidReservationException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidReservation(
            InvalidReservationException exception, HttpServletRequest request) {

        return build(HttpStatus.BAD_REQUEST, exception.getCode(), exception.getMessage(), request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgument(
            IllegalArgumentException exception, HttpServletRequest request) {

        return build(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_FAILED, exception.getMessage(), request);
    }

    /** JSON mal formado o fecha con formato incorrecto. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleUnreadable(
            HttpMessageNotReadableException exception, HttpServletRequest request) {

        return build(
                HttpStatus.BAD_REQUEST,
                ErrorCode.MALFORMED_REQUEST,
                "El cuerpo de la peticion no se pudo leer. Revisa el JSON y que las fechas "
                        + "usen el formato ISO (por ejemplo 2026-08-11T10:00:00).",
                request
        );
    }

    /** Enum invalido en un query param, p. ej. ?category=CAMARAS. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiErrorResponse> handleTypeMismatch(
            MethodArgumentTypeMismatchException exception, HttpServletRequest request) {

        String expected = exception.getRequiredType() != null && exception.getRequiredType().isEnum()
                ? " Valores permitidos: " + String.join(", ", enumNames(exception.getRequiredType()))
                : "";

        return build(
                HttpStatus.BAD_REQUEST,
                ErrorCode.INVALID_PARAMETER,
                "El parametro '" + exception.getName() + "' tiene un valor invalido." + expected,
                request
        );
    }

    // ------------------------------------------------------------------
    // 403 - Sin permiso
    // ------------------------------------------------------------------

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(
            AccessDeniedException exception, HttpServletRequest request) {

        return build(HttpStatus.FORBIDDEN, ErrorCode.ACCESS_DENIED, exception.getMessage(), request);
    }

    // ------------------------------------------------------------------
    // Excepciones que ya traen su propio codigo HTTP: se respeta.
    // Sin esto, el catch-all de abajo las convertiria todas en 500
    // (por ejemplo el 404 de una ruta que no existe).
    // ------------------------------------------------------------------

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNoResource(
            NoResourceFoundException exception, HttpServletRequest request) {

        return build(HttpStatus.NOT_FOUND, ErrorCode.ROUTE_NOT_FOUND,
                "La ruta solicitada no existe", request);
    }

    @ExceptionHandler(ErrorResponseException.class)
    public ResponseEntity<ApiErrorResponse> handleErrorResponse(
            ErrorResponseException exception, HttpServletRequest request) {

        HttpStatus status = HttpStatus.resolve(exception.getStatusCode().value());

        return build(
                status != null ? status : HttpStatus.INTERNAL_SERVER_ERROR,
                ErrorCode.INTERNAL_ERROR,
                exception.getBody().getDetail() != null
                        ? exception.getBody().getDetail()
                        : exception.getMessage(),
                request
        );
    }

    // ------------------------------------------------------------------
    // 500 - Red de seguridad
    // ------------------------------------------------------------------

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(
            Exception exception, HttpServletRequest request) {

        // Se registra el detalle en el log pero NO se expone al cliente.
        log.error("Error no controlado en {}", request.getRequestURI(), exception);

        return build(
                HttpStatus.INTERNAL_SERVER_ERROR,
                ErrorCode.INTERNAL_ERROR,
                "Ocurrio un error inesperado en el servidor",
                request
        );
    }

    // ------------------------------------------------------------------

    private ResponseEntity<ApiErrorResponse> build(
            HttpStatus status, String code, String message, HttpServletRequest request) {

        ApiErrorResponse body = new ApiErrorResponse(
                status.value(),
                status.getReasonPhrase(),
                code,
                message,
                request.getRequestURI()
        );

        return ResponseEntity.status(status).body(body);
    }

    private List<String> enumNames(Class<?> enumType) {
        Object[] constants = enumType.getEnumConstants();
        return constants == null
                ? List.of()
                : java.util.Arrays.stream(constants).map(Object::toString).toList();
    }
}