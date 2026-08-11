package equipment_api.exception;

/**
 * Se lanza cuando la franja horaria pedida se cruza con una reserva ACTIVE ya
 * existente para el mismo equipo. El GlobalExceptionHandler la traduce a 409.
 */
public class ReservationConflictException extends RuntimeException {

    private final Long equipmentId;

    public ReservationConflictException(Long equipmentId) {
        super("El equipo con id " + equipmentId
                + " ya tiene una reserva que se cruza con la franja horaria solicitada");
        this.equipmentId = equipmentId;
    }

    public Long getEquipmentId() {
        return equipmentId;
    }
}