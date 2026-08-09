package co.edu.lab.sistemas.exception;

// Excepción personalizada para indicar que un recurso no fue encontrado, como una categoría o un usuario inexistente.
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}