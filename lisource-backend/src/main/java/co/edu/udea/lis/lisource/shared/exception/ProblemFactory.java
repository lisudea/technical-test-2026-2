package co.edu.udea.lis.lisource.shared.exception;

import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.util.List;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.stereotype.Component;

@Component
public class ProblemFactory {
    public ProblemDetail create(HttpStatus status, ErrorCode code, String detail,
                                HttpServletRequest request, List<FieldErrorDetail> fields) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setTitle(title(code));
        if (request != null) {
            problem.setInstance(URI.create(request.getRequestURI()));
        }
        problem.setProperty("code", code.name());
        problem.setProperty("correlationId", MDC.get("correlationId"));
        problem.setProperty("fieldErrors", fields == null ? List.of() : fields);
        return problem;
    }

    private String title(ErrorCode code) {
        return switch (code) {
            case RESERVATION_CONFLICT -> "Reservation conflict";
            case VALIDATION_ERROR, INVALID_DATE_RANGE -> "Validation failed";
            case ACCESS_DENIED, INSTITUTIONAL_EMAIL_REQUIRED -> "Access denied";
            case INVALID_CREDENTIALS, ACCOUNT_INACTIVE, REFRESH_TOKEN_INVALID, REFRESH_TOKEN_EXPIRED -> "Authentication failed";
            case EQUIPMENT_NOT_FOUND, RESERVATION_NOT_FOUND, RESOURCE_NOT_FOUND -> "Resource not found";
            default -> "LISource request failed";
        };
    }
}

