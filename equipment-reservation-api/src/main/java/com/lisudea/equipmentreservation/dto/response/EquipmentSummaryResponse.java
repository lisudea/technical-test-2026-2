package com.lisudea.equipmentreservation.dto.response;

import java.time.OffsetDateTime;

public class EquipmentSummaryResponse {
    private Long id;
    private String name;
    private String serialNumber;
    private String macAddress;
    private CategoryResponse category;
    private OperationalStatusResponse operationalStatus;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }

    public String getMacAddress() { return macAddress; }
    public void setMacAddress(String macAddress) { this.macAddress = macAddress; }

    public CategoryResponse getCategory() { return category; }
    public void setCategory(CategoryResponse category) { this.category = category; }

    public OperationalStatusResponse getOperationalStatus() { return operationalStatus; }
    public void setOperationalStatus(OperationalStatusResponse operationalStatus) { this.operationalStatus = operationalStatus; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
