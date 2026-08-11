package equipment_api.dto;

public class TopEquipmentResponse {

    private Long equipmentId;
    private String equipmentName;
    private Long reservationCount;

    public TopEquipmentResponse(
            Long equipmentId,
            String equipmentName,
            Long reservationCount) {

        this.equipmentId = equipmentId;
        this.equipmentName = equipmentName;
        this.reservationCount = reservationCount;
    }

    public Long getEquipmentId() {
        return equipmentId;
    }

    public String getEquipmentName() {
        return equipmentName;
    }

    public Long getReservationCount() {
        return reservationCount;
    }
}