package equipment_api.exception;

/**
 * Datos de reserva invalidos: rango horario incoherente, duracion excesiva o
 * falta de identificacion del solicitante.
 *
 * Lleva su propio {@link ErrorCode} para que el cliente sepa exactamente cual
 * de las tres situaciones se ha dado sin tener que leer el mensaje.
 * Se traduce a 400 Bad Request.
 */
public class InvalidReservationException extends RuntimeException {

    private final String code;

    public InvalidReservationException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}