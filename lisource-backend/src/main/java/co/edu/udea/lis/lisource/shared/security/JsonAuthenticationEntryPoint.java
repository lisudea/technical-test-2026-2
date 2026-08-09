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
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

@Component
public class JsonAuthenticationEntryPoint implements AuthenticationEntryPoint {
    private final ObjectMapper mapper;
    private final ProblemFactory problems;

    public JsonAuthenticationEntryPoint(ObjectMapper mapper, ProblemFactory problems) {
        this.mapper = mapper;
        this.problems = problems;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        mapper.writeValue(response.getOutputStream(), problems.create(HttpStatus.UNAUTHORIZED,
                ErrorCode.INVALID_CREDENTIALS, "A valid access token is required.", request, List.of()));
    }
}

