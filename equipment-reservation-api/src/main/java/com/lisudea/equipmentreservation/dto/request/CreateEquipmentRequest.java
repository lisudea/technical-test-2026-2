package com.lisudea.equipmentreservation.dto.request;

import com.lisudea.equipmentreservation.validation.AtLeastOneOf;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@AtLeastOneOf(fields = {"serialNumber", "macAddress"})
public class CreateEquipmentRequest {

    @NotBlank
    @Size(max = 100)
    private String name;

    @Size(max = 100)
    private String serialNumber;

    @Size(max = 100)
    private String macAddress;

    @NotNull
    private Long categoryId;

    @NotNull
    private Long operationalStatusId;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }

    public String getMacAddress() { return macAddress; }
    public void setMacAddress(String macAddress) { this.macAddress = macAddress; }

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }

    public Long getOperationalStatusId() { return operationalStatusId; }
    public void setOperationalStatusId(Long operationalStatusId) { this.operationalStatusId = operationalStatusId; }
}
