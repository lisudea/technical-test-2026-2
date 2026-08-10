package com.udea.labreservas.exception;

import org.springframework.http.HttpStatus;

public class EmailDomainNotAllowedException extends BusinessException {

    public EmailDomainNotAllowedException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}