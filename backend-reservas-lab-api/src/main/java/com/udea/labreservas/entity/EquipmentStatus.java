package com.udea.labreservas.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum EquipmentStatus {

    DISPONIBLE("Disponible"),
    RESERVADO("Reservado"),
    EN_PRESTAMO("En prestamo"),
    EN_MANTENIMIENTO("En mantenimiento");

    private final String dbValue;

    EquipmentStatus(String dbValue) {
        this.dbValue = dbValue;
    }

    @JsonValue
    public String getDbValue() {
        return dbValue;
    }

    public static EquipmentStatus fromDbValue(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().replace("_", " ");
        for (EquipmentStatus status : values()) {
            if (status.dbValue.equalsIgnoreCase(normalized)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Valor de estado no soportado: " + value);
    }

    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public static EquipmentStatus fromJson(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        for (EquipmentStatus status : values()) {
            if (status.name().equalsIgnoreCase(trimmed)
                    || status.dbValue.equalsIgnoreCase(trimmed.replace("_", " "))) {
                return status;
            }
        }
        throw new IllegalArgumentException(
                "Estado invalido. Valores permitidos: Disponible, Reservado, En prestamo, En mantenimiento");
    }
}