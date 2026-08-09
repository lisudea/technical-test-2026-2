package co.edu.udea.lis.lisource.user.application;

import co.edu.udea.lis.lisource.audit.application.AuditPublisher;
import co.edu.udea.lis.lisource.shared.exception.AppException;
import co.edu.udea.lis.lisource.shared.exception.ErrorCode;
import co.edu.udea.lis.lisource.user.api.UserResponse;
import co.edu.udea.lis.lisource.user.domain.UserAccount;
import co.edu.udea.lis.lisource.user.infrastructure.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {
    private static final int MAX_NAME_LENGTH = 100;
    private static final java.util.regex.Pattern NAME = java.util.regex.Pattern.compile(
            "^[\\p{L}\\p{M}][\\p{L}\\p{M} .'’-]*$");
    private final UserRepository users;
    private final AuditPublisher audit;

    public ProfileService(UserRepository users, AuditPublisher audit) {
        this.users = users;
        this.audit = audit;
    }

    public UserResponse get(long userId, String activeRole) {
        return UserResponse.from(required(userId), activeRole);
    }

    @Transactional
    public UserResponse update(long userId, String activeRole, String firstName, String lastName, String languageCode) {
        UserAccount before = required(userId);
        String normalizedFirst = normalize(firstName);
        String normalizedLast = normalize(lastName);
        if (languageCode != null && (!languageCode.matches("^[a-z]{2,3}(-[A-Z]{2})?$")
                || !users.isActiveLanguage(languageCode))) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.VALIDATION_ERROR,
                    "Unsupported language code.");
        }
        users.updateProfile(userId, normalizedFirst, normalizedLast, languageCode);
        UserAccount after = required(userId);
        audit.success("ACTUALIZAR_PERFIL", userId, userId, "User profile updated",
                java.util.Map.of("firstName", before.firstName(), "lastName", before.lastName(),
                        "languageCode", before.languageCode() == null ? "" : before.languageCode()),
                java.util.Map.of("firstName", after.firstName(), "lastName", after.lastName(),
                        "languageCode", after.languageCode() == null ? "" : after.languageCode()));
        return UserResponse.from(after, activeRole);
    }

    private UserAccount required(long id) {
        return users.findById(id).orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                ErrorCode.RESOURCE_NOT_FOUND, "User profile was not found."));
    }

    private String normalize(String value) {
        if (value == null) return null;
        String result = value.trim();
        if (result.isBlank() || result.length() > MAX_NAME_LENGTH || !NAME.matcher(result).matches()
                || result.codePoints().anyMatch(Character::isISOControl)) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY,
                ErrorCode.VALIDATION_ERROR, "Profile name is invalid.");
        }
        return result;
    }
}
