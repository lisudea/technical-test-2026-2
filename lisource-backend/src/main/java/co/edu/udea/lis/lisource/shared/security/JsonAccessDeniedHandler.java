package co.edu.udea.lis.lisource.shared.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import co.edu.udea.lis.lisource.shared.exception.ErrorCode;
import co.edu.udea.lis.lisource.shared.exception.ProblemFactory;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

@Component
public class JsonAccessDeniedHandler implements AccessDeniedHandler {
    private final ObjectMapper mapper;
    private final ProblemFactory problems;

    public JsonAccessDeniedHandler(ObjectMapper mapper, ProblemFactory problems) {
        this.mapper = mapper;
        this.problems = problems;
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException, ServletException {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        mapper.writeValue(response.getOutputStream(), problems.create(HttpStatus.FORBIDDEN,
                ErrorCode.ACCESS_DENIED, "You do not have permission to perform this operation.", request, List.of()));
    }
}

