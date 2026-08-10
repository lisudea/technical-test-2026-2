package com.lisudea.equipmentreservation.dto.response;

import java.time.OffsetDateTime;

public class AvailabilityResponse {
    private Long equipmentId;
    private String availability;
    private OffsetDateTime nextAvailableStartAt;
    private OffsetDateTime nextReservedStartAt;

    public Long getEquipmentId() { return equipmentId; }
    public void setEquipmentId(Long equipmentId) { this.equipmentId = equipmentId; }

    public String getAvailability() { return availability; }
    public void setAvailability(String availability) { this.availability = availability; }

    public OffsetDateTime getNextAvailableStartAt() { return nextAvailableStartAt; }
    public void setNextAvailableStartAt(OffsetDateTime nextAvailableStartAt) { this.nextAvailableStartAt = nextAvailableStartAt; }

    public OffsetDateTime getNextReservedStartAt() { return nextReservedStartAt; }
    public void setNextReservedStartAt(OffsetDateTime nextReservedStartAt) { this.nextReservedStartAt = nextReservedStartAt; }
}
