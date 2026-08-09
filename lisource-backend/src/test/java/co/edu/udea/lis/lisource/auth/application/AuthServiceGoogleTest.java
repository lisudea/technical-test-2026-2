package co.edu.udea.lis.lisource.auth.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import co.edu.udea.lis.lisource.audit.application.AuditPublisher;
import co.edu.udea.lis.lisource.auth.domain.GoogleIdentity;
import co.edu.udea.lis.lisource.auth.domain.GoogleTokenVerifier;
import co.edu.udea.lis.lisource.auth.domain.PasswordRecoveryNotifier;
import co.edu.udea.lis.lisource.auth.infrastructure.AuthRepository;
import co.edu.udea.lis.lisource.configuration.application.ConfigurationService;
import co.edu.udea.lis.lisource.shared.security.JwtService;
import co.edu.udea.lis.lisource.shared.security.TokenCodec;
import co.edu.udea.lis.lisource.shared.util.RequestMetadata;
import co.edu.udea.lis.lisource.user.domain.UserAccount;
import co.edu.udea.lis.lisource.user.infrastructure.UserRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthServiceGoogleTest {
    @Test
    void verifiedInstitutionalIdentityCreatesInternalAccountAndSession() {
        UserRepository users = mock(UserRepository.class);
        AuthRepository auth = mock(AuthRepository.class);
        ConfigurationService configuration = mock(ConfigurationService.class);
        PasswordEncoder passwords = mock(PasswordEncoder.class);
        JwtService jwt = mock(JwtService.class);
        TokenCodec tokens = mock(TokenCodec.class);
        GoogleTokenVerifier google = credential ->
                new GoogleIdentity("google-sub-123", "Nueva@UDEA.EDU.CO", "Nueva", "Persona");
        EmailDomainPolicy policy = new EmailDomainPolicy(configuration);
        PasswordRecoveryNotifier notifier = (email, token) -> {};
        AuditPublisher audit = mock(AuditPublisher.class);
        Clock clock = Clock.fixed(Instant.parse("2030-01-01T12:00:00Z"), ZoneOffset.UTC);

        when(configuration.stringOr(ConfigurationService.EMAIL_DOMAIN, "udea.edu.co"))
                .thenReturn("udea.edu.co");
        when(configuration.stringOr(ConfigurationService.DEFAULT_LANGUAGE, "es")).thenReturn("es");
        when(configuration.integerOr(ConfigurationService.REFRESH_DAYS, 7)).thenReturn(7);
        when(users.findByGoogleSub("google-sub-123")).thenReturn(Optional.empty());
        when(users.findByEmail("nueva@udea.edu.co")).thenReturn(Optional.empty());
        when(users.createGoogleUser("nueva@udea.edu.co", "google-sub-123", "Nueva", "Persona", "es"))
                .thenReturn(77L);
        UserAccount created = new UserAccount(77L, "nueva@udea.edu.co", null, "google-sub-123",
                "Nueva", "Persona", "ACTIVO", "es", Set.of("USUARIO"));
        when(users.findById(77L)).thenReturn(Optional.of(created));
        when(tokens.generate()).thenReturn("raw-refresh-token");
        when(tokens.sha256("raw-refresh-token.USUARIO")).thenReturn("refresh-token-hash");
        when(auth.createSession(eq(77L), eq("refresh-token-hash"), any(), any(), any(), any()))
                .thenReturn(901L);
        when(jwt.issue(created, "USUARIO", 901L))
                .thenReturn(new JwtService.AccessToken("signed-access-token", 900));

        AuthService service = new AuthService(users, auth, configuration, passwords, jwt, tokens,
                google, policy, notifier, audit, clock);
        var result = service.loginGoogle("verified-google-credential", new RequestMetadata("127.0.0.1", "test"));

        assertThat(result.response().accessToken()).isEqualTo("signed-access-token");
        assertThat(result.response().user().email()).isEqualTo("nueva@udea.edu.co");
        assertThat(result.response().user().roles()).containsExactly("USUARIO");
        verify(users).assignBaseRole(77L);
        verify(users).updateLastAccess(77L);
        verify(auth).createSession(eq(77L), eq("refresh-token-hash"), any(), any(), eq("127.0.0.1"), eq("test"));
        verify(auth).revokeExcessActiveSessions(eq(77L), eq(901L), any(), any(), eq(5));
        verify(jwt).issue(created, "USUARIO", 901L);
    }
}
