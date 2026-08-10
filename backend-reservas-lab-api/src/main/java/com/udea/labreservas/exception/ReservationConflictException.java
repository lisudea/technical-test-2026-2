package com.udea.labreservas.exception;

import org.springframework.http.HttpStatus;

public class ReservationConflictException extends BusinessException {

    public ReservationConflictException(String message) {
        super(message, HttpStatus.CONFLICT);
    }
}