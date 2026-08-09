package co.edu.udea.lis.lisource.user.domain;

import java.util.Set;

public record UserAccount(
        long id,
        String email,
        String passwordHash,
        String googleSub,
        String firstName,
        String lastName,
        String stateCode,
        String languageCode,
        Set<String> roles) {

    public boolean active() {
        return "ACTIVO".equals(stateCode);
    }
}

