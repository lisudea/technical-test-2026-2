package co.edu.lab.sistemas.exception;

// Excepción personalizada para indicar que un token de Google es inválido.
public class InvalidGoogleTokenException extends RuntimeException {
    public InvalidGoogleTokenException(String message) {
        super(message);
    }
}