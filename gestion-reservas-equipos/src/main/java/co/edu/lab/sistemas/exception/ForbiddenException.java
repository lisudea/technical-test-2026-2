package co.edu.lab.sistemas.exception;

// Excepción para denegar acciones cuando no coincide la credencial de confirmación.
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}