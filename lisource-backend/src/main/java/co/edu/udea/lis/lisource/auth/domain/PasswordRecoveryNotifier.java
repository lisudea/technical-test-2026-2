package co.edu.udea.lis.lisource.auth.domain;

public interface PasswordRecoveryNotifier {
    void notify(String email, String rawToken);
}

