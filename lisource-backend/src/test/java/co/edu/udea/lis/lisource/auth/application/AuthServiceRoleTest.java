package co.edu.udea.lis.lisource.auth.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import co.edu.udea.lis.lisource.audit.application.AuditPublisher;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthServiceRoleTest {
    private final UserRepository users = mock(UserRepository.class);
    private final AuthRepository auth = mock(AuthRepository.class);
    private final ConfigurationService configuration = mock(ConfigurationService.class);
    private final PasswordEncoder passwords = mock(PasswordEncoder.class);
    private final JwtService jwt = mock(JwtService.class);
    private final TokenCodec tokens = mock(TokenCodec.class);
    private final AuditPublisher audit = mock(AuditPublisher.class);
    private final UserAccount dual = new UserAccount(44, "dual@udea.edu.co", "$argon2id$hash", null,
            "Dual", "Role", "ACTIVO", "es", Set.of("USUARIO", "ADMINISTRADOR"));
    private AuthService service;

    @BeforeEach
    void setUp() {
        service = new AuthService(users, auth, configuration, passwords, jwt, tokens,
                mock(GoogleTokenVerifier.class), new EmailDomainPolicy(configuration),
                mock(PasswordRecoveryNotifier.class), audit,
                Clock.fixed(Instant.parse("2030-01-01T12:00:00Z"), ZoneOffset.UTC));
        when(users.findById(44)).thenReturn(Optional.of(dual));
    }

    @Test
    void multiRoleLoginRequiresSignedRoleSelectionBeforeCreatingSession() {
        when(users.findByEmail("dual@udea.edu.co")).thenReturn(Optional.of(dual));
        when(passwords.matches("correct", dual.passwordHash())).thenReturn(true);
        when(jwt.issueRoleSelection(dual)).thenReturn("signed-selection");

        var result = service.login("DUAL@UDEA.EDU.CO", "correct", new RequestMetadata("127.0.0.1", "test"));

        assertThat(result.response().roleSelectionRequired()).isTrue();
        assertThat(result.response().availableRoles()).containsExactly("ADMINISTRADOR", "USUARIO");
        assertThat(result.response().selectionToken()).isEqualTo("signed-selection");
        assertThat(result.refreshToken()).isNull();
        verifyNoInteractions(auth);
    }

    @Test
    void selectedAssignedRoleBecomesTheOnlyActiveJwtAuthority() {
        when(jwt.decodeRoleSelection("signed-selection"))
                .thenReturn(new JwtService.RoleSelectionToken(44, dual.roles()));
        when(tokens.generate()).thenReturn("opaque");
        when(tokens.sha256("opaque.USUARIO")).thenReturn("hash");
        when(configuration.integerOr(ConfigurationService.REFRESH_DAYS, 7)).thenReturn(7);
        when(auth.createSession(eq(44L), eq("hash"), any(), any(), any(), any())).thenReturn(3L);
        when(jwt.issue(dual, "USUARIO", 3L)).thenReturn(new JwtService.AccessToken("access", 900));

        var result = service.selectRole("signed-selection", "USUARIO", new RequestMetadata("127.0.0.1", "test"));

        assertThat(result.response().user().role()).isEqualTo("USER");
        assertThat(result.response().user().roles()).containsExactlyInAnyOrder("USUARIO", "ADMINISTRADOR");
        assertThat(result.refreshToken()).endsWith(".USUARIO");
        verify(jwt).issue(dual, "USUARIO", 3L);
    }
}
