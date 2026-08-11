package equipment_api.exception;

public class EquipmentNotFoundException extends RuntimeException {

    public EquipmentNotFoundException(Long id) {
        super("Equipment with id " + id + " not found");
    }
}