package co.edu.udea.lis.lisource.user.api;

import co.edu.udea.lis.lisource.user.domain.UserAccount;
import java.util.List;

public record UserResponse(
        long id,
        String firstName,
        String lastName,
        String email,
        List<String> roles,
        String role,
        String languageCode,
        String preferredLanguage) {

    public static UserResponse from(UserAccount user, String activeRole) {
        List<String> roles = user.roles().stream().sorted().toList();
        String frontendRole = "ADMINISTRADOR".equals(activeRole) ? "ADMIN" : "USER";
        String language = user.languageCode() == null ? "es" : user.languageCode();
        return new UserResponse(user.id(), user.firstName(), user.lastName(), user.email(),
                roles, frontendRole, language, language);
    }

    public static UserResponse from(UserAccount user) {
        String fallback = user.roles().size() == 1 ? user.roles().iterator().next() : "USUARIO";
        return from(user, fallback);
    }
}
