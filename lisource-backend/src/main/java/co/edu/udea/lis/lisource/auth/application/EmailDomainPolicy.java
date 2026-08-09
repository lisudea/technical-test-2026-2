package co.edu.udea.lis.lisource.auth.application;

import co.edu.udea.lis.lisource.configuration.application.ConfigurationService;
import co.edu.udea.lis.lisource.shared.exception.AppException;
import co.edu.udea.lis.lisource.shared.exception.ErrorCode;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class EmailDomainPolicy {
    private final ConfigurationService configuration;

    public EmailDomainPolicy(ConfigurationService configuration) {
        this.configuration = configuration;
    }

    public String requireInstitutional(String email) {
        String normalized = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        int separator = normalized.lastIndexOf('@');
        String domain = separator < 1 ? "" : normalized.substring(separator + 1);
        String expected = configuration.stringOr(ConfigurationService.EMAIL_DOMAIN, "udea.edu.co")
                .trim().toLowerCase(Locale.ROOT);
        if (!domain.equals(expected) || normalized.indexOf('@') != separator) {
            throw new AppException(HttpStatus.FORBIDDEN, ErrorCode.INSTITUTIONAL_EMAIL_REQUIRED,
                    "An institutional email address is required.");
        }
        return normalized;
    }
}
