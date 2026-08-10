package com.udea.labreservas.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ReservationStatus {

    CREADA("Creada"),
    CANCELADA("Cancelada"),
    FINALIZADA("Finalizada");

    private final String dbValue;

    ReservationStatus(String dbValue) {
        this.dbValue = dbValue;
    }

    @JsonValue
    public String getDbValue() {
        return dbValue;
    }

    public static ReservationStatus fromDbValue(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().replace("_", " ");
        for (ReservationStatus status : values()) {
            if (status.dbValue.equalsIgnoreCase(normalized)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Valor de estado de reserva no soportado: " + value);
    }

    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public static ReservationStatus fromJson(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        for (ReservationStatus status : values()) {
            if (status.name().equalsIgnoreCase(trimmed)
                    || status.dbValue.equalsIgnoreCase(trimmed.replace("_", " "))) {
                return status;
            }
        }
        throw new IllegalArgumentException(
                "Estado de reserva invalido. Valores permitidos: Creada, Cancelada, Finalizada");
    }
}