package co.edu.lab.sistemas.exception;

// Excepción personalizada para indicar conflictos, como intentos de crear reservas duplicadas.
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}