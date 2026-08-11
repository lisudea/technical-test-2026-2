package equipment_api.exception;

/**
 * Identificadores estables de cada situacion de error.
 *
 * Son parte del contrato publico de la API: el frontend los usa para elegir el
 * mensaje que muestra al usuario. NO deben renombrarse sin actualizar tambien
 * al cliente, y no dependen del idioma ni de la redaccion del mensaje.
 */
public final class ErrorCode {

    private ErrorCode() {}

    // --- 404 -------------------------------------------------------------
    public static final String EQUIPMENT_NOT_FOUND = "EQUIPMENT_NOT_FOUND";
    public static final String RESERVATION_NOT_FOUND = "RESERVATION_NOT_FOUND";
    public static final String USER_NOT_FOUND = "USER_NOT_FOUND";
    public static final String ROUTE_NOT_FOUND = "ROUTE_NOT_FOUND";

    // --- 409 -------------------------------------------------------------
    /** La franja horaria se cruza con otra reserva activa del mismo equipo. */
    public static final String RESERVATION_OVERLAP = "RESERVATION_OVERLAP";
    /** El equipo esta en mantenimiento y no admite reservas. */
    public static final String EQUIPMENT_IN_MAINTENANCE = "EQUIPMENT_IN_MAINTENANCE";
    /** Violacion de unicidad, tipicamente un numero de serie repetido. */
    public static final String DUPLICATE_RESOURCE = "DUPLICATE_RESOURCE";

    // --- 400 -------------------------------------------------------------
    public static final String VALIDATION_FAILED = "VALIDATION_FAILED";
    /** La hora de inicio no es anterior a la de fin. */
    public static final String INVALID_TIME_RANGE = "INVALID_TIME_RANGE";
    /** La reserva supera la duracion maxima permitida. */
    public static final String RESERVATION_TOO_LONG = "RESERVATION_TOO_LONG";
    /** Peticion anonima sin nombre ni correo. */
    public static final String IDENTITY_REQUIRED = "IDENTITY_REQUIRED";
    public static final String MALFORMED_REQUEST = "MALFORMED_REQUEST";
    public static final String INVALID_PARAMETER = "INVALID_PARAMETER";

    // --- 403 / 500 -------------------------------------------------------
    public static final String ACCESS_DENIED = "ACCESS_DENIED";
    public static final String INTERNAL_ERROR = "INTERNAL_ERROR";
}