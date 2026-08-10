package com.udea.labreservas.exception;

import org.springframework.http.HttpStatus;

public class EquipmentNotAvailableException extends BusinessException {

    public EquipmentNotAvailableException(String message) {
        super(message, HttpStatus.CONFLICT);
    }
}