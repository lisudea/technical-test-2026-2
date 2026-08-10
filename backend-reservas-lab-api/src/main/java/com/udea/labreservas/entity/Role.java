package com.udea.labreservas.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum Role {

    USUARIO("Usuario"),
    ADMINISTRADOR("Administrador");

    private final String dbValue;

    Role(String dbValue) {
        this.dbValue = dbValue;
    }

    @JsonValue
    public String getDbValue() {
        return dbValue;
    }

    public static Role fromDbValue(String value) {
        if (value == null) {
            return null;
        }
        for (Role role : values()) {
            if (role.dbValue.equalsIgnoreCase(value.trim())) {
                return role;
            }
        }
        throw new IllegalArgumentException("Valor de rol no soportado: " + value);
    }

    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public static Role fromJson(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        for (Role role : values()) {
            if (role.name().equalsIgnoreCase(trimmed)
                    || role.dbValue.equalsIgnoreCase(trimmed)) {
                return role;
            }
        }
        throw new IllegalArgumentException("Rol invalido. Valores permitidos: Usuario, Administrador");
    }
}