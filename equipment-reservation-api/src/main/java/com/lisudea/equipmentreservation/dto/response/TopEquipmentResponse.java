package com.lisudea.equipmentreservation.dto.response;

public class TopEquipmentResponse {
    private Long equipmentId;
    private String equipmentName;
    private Long reservationCount;

    public TopEquipmentResponse() {}

    public TopEquipmentResponse(Long equipmentId, String equipmentName, Long reservationCount) {
        this.equipmentId = equipmentId;
        this.equipmentName = equipmentName;
        this.reservationCount = reservationCount;
    }

    public Long getEquipmentId() { return equipmentId; }
    public void setEquipmentId(Long equipmentId) { this.equipmentId = equipmentId; }

    public String getEquipmentName() { return equipmentName; }
    public void setEquipmentName(String equipmentName) { this.equipmentName = equipmentName; }

    public Long getReservationCount() { return reservationCount; }
    public void setReservationCount(Long reservationCount) { this.reservationCount = reservationCount; }
}
