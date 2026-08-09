package com.lis.reservas.common;

import com.lis.reservas.common.exception.DominioNoAutorizadoException;
import com.lis.reservas.common.exception.EquipoNoDisponibleException;
import com.lis.reservas.common.exception.RecursoNoEncontradoException;
import com.lis.reservas.common.exception.ReservaEnConflictoException;
import com.lis.reservas.common.exception.ValidacionException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Global REST advice that translates every exception escaping the controllers
 * into an <a href="https://datatracker.ietf.org/doc/html/rfc7807">RFC 7807</a>
 * {@link ProblemDetail} response with {@code application/problem+json} content
 * type.
 *
 * <p>Extending {@link ResponseEntityExceptionHandler} lets us inherit Spring
 * MVC's handling of standard framework exceptions
 * ({@link MethodArgumentNotValidException},
 * {@link org.springframework.http.converter.HttpMessageNotReadableException},
 * etc.) while overriding the cases where we want a custom {@code type} URI or
 * title. Domain-specific exceptions are mapped by dedicated
 * {@link ExceptionHandler} methods to their canonical HTTP status:
 *
 * <ul>
 *   <li>{@link ReservaEnConflictoException} &rarr; 409 Conflict</li>
 *   <li>{@link EquipoNoDisponibleException}  &rarr; 409 Conflict</li>
 *   <li>{@link RecursoNoEncontradoException} &rarr; 404 Not Found</li>
 *   <li>{@link ValidacionException}          &rarr; 400 Bad Request</li>
 *   <li>{@link DominioNoAutorizadoException}  &rarr; 403 Forbidden</li>
 *   <li>{@link AccessDeniedException}          &rarr; 403 Forbidden</li>
 *   <li>{@link AuthenticationException}       &rarr; 401 Unauthorized</li>
 *   <li>any other {@link Exception}            &rarr; 500 (generic message)</li>
 * </ul>
 *
 * <p>The generic 500 path deliberately does NOT echo the exception message:
 * leaking internals (SQL fragments, stack-trace roots) is an information-
 * disclosure risk. The detail is a neutral, user-safe string; the real cause
 * is kept in the server logs.
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    /** Base namespace for stable, documented error type URIs. */
    private static final String ERRORS_NS = "https://lis.udea.edu.co/errors/";

    // --- Domain exceptions -------------------------------------------------

    @ExceptionHandler(ReservaEnConflictoException.class)
    public ResponseEntity<ProblemDetail> handleReservaEnConflicto(ReservaEnConflictoException ex) {
        return build(HttpStatus.CONFLICT, "reserva-en-conflicto",
                "Conflicto de reserva", ex.getMessage());
    }

    @ExceptionHandler(EquipoNoDisponibleException.class)
    public ResponseEntity<ProblemDetail> handleEquipoNoDisponible(EquipoNoDisponibleException ex) {
        return build(HttpStatus.CONFLICT, "equipo-no-disponible",
                "Equipo no disponible", ex.getMessage());
    }

    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ResponseEntity<ProblemDetail> handleRecursoNoEncontrado(RecursoNoEncontradoException ex) {
        return build(HttpStatus.NOT_FOUND, "recurso-no-encontrado",
                "Recurso no encontrado", ex.getMessage());
    }

    @ExceptionHandler(ValidacionException.class)
    public ResponseEntity<ProblemDetail> handleValidacion(ValidacionException ex) {
        return build(HttpStatus.BAD_REQUEST, "validacion",
                "Error de validacion", ex.getMessage());
    }

    @ExceptionHandler(DominioNoAutorizadoException.class)
    public ResponseEntity<ProblemDetail> handleDominioNoAutorizado(DominioNoAutorizadoException ex) {
        return build(HttpStatus.FORBIDDEN, "dominio-no-autorizado",
                "Dominio no autorizado", ex.getMessage());
    }

    // --- Security exceptions ----------------------------------------------

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ProblemDetail> handleAccessDenied(AccessDeniedException ex) {
        return build(HttpStatus.FORBIDDEN, "acceso-denegado",
                "Acceso denegado", "No tiene permisos para realizar esta accion");
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ProblemDetail> handleAuthentication(AuthenticationException ex) {
        return build(HttpStatus.UNAUTHORIZED, "no-autenticado",
                "No autenticado", "Se requiere autenticacion para acceder");
    }

    // --- Standard Spring MVC overrides -------------------------------------

    @Override
    @NonNull
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, @NonNull HttpHeaders headers,
            @NonNull HttpStatusCode status, @NonNull WebRequest request) {

        ProblemDetail problem = ex.getBody();
        problem.setType(URI.create(ERRORS_NS + "validacion"));
        problem.setTitle("Error de validacion");

        List<Map<String, String>> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> {
                    Map<String, String> err = new LinkedHashMap<>();
                    err.put("campo", fe.getField());
                    err.put("mensaje", fe.getDefaultMessage() == null ? "" : fe.getDefaultMessage());
                    return err;
                })
                .toList();
        problem.setProperty("errors", fieldErrors);

        return handleExceptionInternal(ex, problem, headers, status, request);
    }

    @Override
    @NonNull
    protected ResponseEntity<Object> handleHttpMessageNotReadable(
            org.springframework.http.converter.HttpMessageNotReadableException ex,
            @NonNull HttpHeaders headers, @NonNull HttpStatusCode status,
            @NonNull WebRequest request) {

        // HttpMessageNotReadableException predates the ErrorResponse contract
        // in this Spring line, so the body is built manually (no getBody()).
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "El cuerpo de la peticion no es JSON valido o falta");
        problem.setType(URI.create(ERRORS_NS + "cuerpo-no-legible"));
        problem.setTitle("Cuerpo de la peticion invalido");

        return handleExceptionInternal(ex, problem, headers, HttpStatus.BAD_REQUEST, request);
    }

    // --- Catch-all ---------------------------------------------------------

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleGeneric(Exception ex) {
        // Never leak the root cause to the client; log it server-side instead.
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "error-interno",
                "Error interno", "Ocurrio un error inesperado");
    }

    // --- helper ------------------------------------------------------------

    /**
     * Build a canonical {@link ProblemDetail} response with the RFC 7807
     * content type and stable {@code type} URI.
     */
    private ResponseEntity<ProblemDetail> build(HttpStatus status, String typeSlug,
                                               String title, String detail) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setType(URI.create(ERRORS_NS + typeSlug));
        problem.setTitle(title);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PROBLEM_JSON);
        return new ResponseEntity<>(problem, headers, status);
    }
}
