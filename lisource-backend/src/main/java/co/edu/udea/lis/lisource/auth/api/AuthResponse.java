package co.edu.udea.lis.lisource.auth.api;

import co.edu.udea.lis.lisource.user.api.UserResponse;
import java.util.List;

public record AuthResponse(
        String accessToken,
        String tokenType,
        Long expiresIn,
        UserResponse user,
        boolean roleSelectionRequired,
        List<String> availableRoles,
        String selectionToken) {

    public static AuthResponse authenticated(String accessToken, long expiresIn, UserResponse user) {
        return new AuthResponse(accessToken, "Bearer", expiresIn, user, false, user.roles(), null);
    }

    public static AuthResponse selectionRequired(List<String> availableRoles, String selectionToken) {
        return new AuthResponse(null, null, null, null, true, availableRoles, selectionToken);
    }
}
