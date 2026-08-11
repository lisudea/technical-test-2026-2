package equipment_api.dto;

import equipment_api.entity.Reservation;
import equipment_api.entity.ReservationStatus;

import java.time.LocalDateTime;

public class ReservationResponse {

    private Long id;
    private Long equipmentId;
    private String equipmentName;
    private Long userId;
    private String userName;
    private String userEmail;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private ReservationStatus status;
    private LocalDateTime createdAt;

    public ReservationResponse(Reservation reservation) {
        this.id = reservation.getId();
        this.equipmentId = reservation.getEquipment().getId();
        this.equipmentName = reservation.getEquipment().getName();
        this.userId = reservation.getUser().getId();
        this.userName = reservation.getUser().getName();
        this.userEmail = reservation.getUser().getEmail();
        this.startTime = reservation.getStartTime();
        this.endTime = reservation.getEndTime();
        this.status = reservation.getStatus() != null
                ? reservation.getStatus()
                : ReservationStatus.ACTIVE;
        this.createdAt = reservation.getCreatedAt();
    }

    public Long getId() {
        return id;
    }

    public Long getEquipmentId() {
        return equipmentId;
    }

    public String getEquipmentName() {
        return equipmentName;
    }

    public Long getUserId() {
        return userId;
    }

    public String getUserName() {
        return userName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public ReservationStatus getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}