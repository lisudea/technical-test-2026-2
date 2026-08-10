package com.lisudea.equipmentreservation.dto.response;

import java.time.OffsetDateTime;

public class ReservationResponse {
    private Long id;
    private EquipmentReservationSummary equipment;
    private String userName;
    private String userEmail;
    private OffsetDateTime startAt;
    private OffsetDateTime endAt;
    private ReservationStatusResponse status;
    private String cancellationReason;
    private OffsetDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public EquipmentReservationSummary getEquipment() { return equipment; }
    public void setEquipment(EquipmentReservationSummary equipment) { this.equipment = equipment; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public OffsetDateTime getStartAt() { return startAt; }
    public void setStartAt(OffsetDateTime startAt) { this.startAt = startAt; }

    public OffsetDateTime getEndAt() { return endAt; }
    public void setEndAt(OffsetDateTime endAt) { this.endAt = endAt; }

    public ReservationStatusResponse getStatus() { return status; }
    public void setStatus(ReservationStatusResponse status) { this.status = status; }

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
