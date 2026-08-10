package com.github.cristianalvarez00.reservas_lis.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

/*
MANEJO GENERAL DE ERRORES:
Cuando en los servicios se lanza un RuntimeException, este manejador devuelve
un HTTP 400 con un JSON sencillo. De esta manera el frontend puede mostrar
el mensaje real del error al usuario.
*/
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> manejarRuntimeException(RuntimeException ex) {
        // Se devuelve HTTP 400 con el mensaje generado desde el servicio.
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", ex.getMessage()));
    }
}