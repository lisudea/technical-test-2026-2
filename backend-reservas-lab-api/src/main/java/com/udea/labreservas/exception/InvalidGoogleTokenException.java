package com.udea.labreservas.exception;

import org.springframework.http.HttpStatus;

public class InvalidGoogleTokenException extends BusinessException {

    public InvalidGoogleTokenException(String message) {
        super(message, HttpStatus.UNAUTHORIZED);
    }
}