package co.edu.lab.sistemas.exception;

// Excepción para solicitudes con reglas de negocio o validaciones temporales inválidas.
public class InvalidRequestException extends RuntimeException {
    public InvalidRequestException(String message) {
        super(message);
    }
}