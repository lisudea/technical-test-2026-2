package equipment_api.exception;

/**
 * El equipo existe, pero su estado no admite reservas.
 *
 * Es un conflicto con el estado actual del recurso, no un error de datos, asi
 * que el GlobalExceptionHandler lo traduce a 409 igual que el solapamiento.
 * Se distinguen por el campo `code` de la respuesta.
 */
public class EquipmentNotAvailableException extends RuntimeException {

    private final Long equipmentId;

    public EquipmentNotAvailableException(Long equipmentId, String equipmentName) {
        super("El equipo '" + equipmentName + "' esta en mantenimiento y no admite reservas");
        this.equipmentId = equipmentId;
    }

    public Long getEquipmentId() {
        return equipmentId;
    }
}