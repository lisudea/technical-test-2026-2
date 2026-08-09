package co.edu.udea.lis.lisource.shared.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private final ProblemFactory problems;

    public GlobalExceptionHandler(ProblemFactory problems) {
        this.problems = problems;
    }

    @ExceptionHandler(AppException.class)
    ResponseEntity<ProblemDetail> app(AppException exception, HttpServletRequest request) {
        return ResponseEntity.status(exception.status())
                .body(problems.create(exception.status(), exception.code(), exception.getMessage(), request, List.of()));
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})
    ResponseEntity<ProblemDetail> validation(BindException exception, HttpServletRequest request) {
        List<FieldErrorDetail> fields = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> new FieldErrorDetail(error.getField(),
                        error.getCode() == null ? ErrorCode.VALIDATION_ERROR.name() : error.getCode(),
                        error.getDefaultMessage() == null ? "Invalid value" : error.getDefaultMessage()))
                .toList();
        return ResponseEntity.unprocessableEntity().body(problems.create(HttpStatus.UNPROCESSABLE_ENTITY,
                ErrorCode.VALIDATION_ERROR, "One or more fields are invalid.", request, fields));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ResponseEntity<ProblemDetail> constraint(ConstraintViolationException exception, HttpServletRequest request) {
        List<FieldErrorDetail> fields = exception.getConstraintViolations().stream()
                .map(error -> new FieldErrorDetail(error.getPropertyPath().toString(),
                        ErrorCode.VALIDATION_ERROR.name(), error.getMessage()))
                .toList();
        return ResponseEntity.unprocessableEntity().body(problems.create(HttpStatus.UNPROCESSABLE_ENTITY,
                ErrorCode.VALIDATION_ERROR, "One or more values are invalid.", request, fields));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ProblemDetail> malformed(HttpMessageNotReadableException exception, HttpServletRequest request) {
        return ResponseEntity.badRequest().body(problems.create(HttpStatus.BAD_REQUEST,
                ErrorCode.VALIDATION_ERROR, "Malformed JSON request.", request, List.of()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ProblemDetail> integrity(DataIntegrityViolationException exception, HttpServletRequest request) {
        log.warn("Database constraint rejected request: {}", exception.getMostSpecificCause().getClass().getSimpleName());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(problems.create(HttpStatus.CONFLICT,
                ErrorCode.EQUIPMENT_IDENTIFIER_CONFLICT,
                "The request conflicts with existing data.", request, List.of()));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ProblemDetail> unexpected(Exception exception, HttpServletRequest request) {
        log.error("Unexpected request failure", exception);
        return ResponseEntity.internalServerError().body(problems.create(HttpStatus.INTERNAL_SERVER_ERROR,
                ErrorCode.INTERNAL_ERROR, "An unexpected error occurred.", request, List.of()));
    }
}

