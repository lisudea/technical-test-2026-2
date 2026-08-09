package co.edu.udea.lis.lisource.auth.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import co.edu.udea.lis.lisource.audit.application.AuditPublisher;
import co.edu.udea.lis.lisource.auth.domain.*;
import co.edu.udea.lis.lisource.auth.infrastructure.AuthRepository;
import co.edu.udea.lis.lisource.configuration.application.ConfigurationService;
import co.edu.udea.lis.lisource.shared.exception.AppException;
import co.edu.udea.lis.lisource.shared.security.JwtService;
import co.edu.udea.lis.lisource.shared.security.TokenCodec;
import co.edu.udea.lis.lisource.shared.util.RequestMetadata;
import co.edu.udea.lis.lisource.user.domain.UserAccount;
import co.edu.udea.lis.lisource.user.infrastructure.UserRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthServiceSessionTest {
    private static final Instant NOW = Instant.parse("2030-01-02T12:00:00Z");
    private final UserRepository users = mock(UserRepository.class);
    private final AuthRepository auth = mock(AuthRepository.class);
    private final ConfigurationService configuration = mock(ConfigurationService.class);
    private final TokenCodec tokens = mock(TokenCodec.class);
    private final JwtService jwt = mock(JwtService.class);
    private final AuditPublisher audit = mock(AuditPublisher.class);
    private AuthService service;

    @BeforeEach
    void setUp() {
        when(configuration.integerOr(ConfigurationService.SESSION_IDLE_HOURS, 24)).thenReturn(24);
        when(configuration.integerOr(ConfigurationService.MAX_ACTIVE_SESSIONS, 5)).thenReturn(5);
        service = new AuthService(users, auth, configuration, mock(PasswordEncoder.class),
                jwt, tokens, mock(GoogleTokenVerifier.class),
                new EmailDomainPolicy(configuration), mock(PasswordRecoveryNotifier.class), audit,
                Clock.fixed(NOW, ZoneOffset.UTC));
        when(tokens.sha256("refresh.USUARIO")).thenReturn("hash");
    }

    @Test
    void expiredRevokedAndIdleSessionsCannotRefresh() {
        SessionRecord expired = new SessionRecord(1, 7, NOW.minusSeconds(60), NOW, null, null);
        SessionRecord revoked = new SessionRecord(2, 7, NOW.minusSeconds(60), NOW.plusSeconds(60),
                null, NOW.minusSeconds(1));
        SessionRecord idle = new SessionRecord(3, 7, NOW.minus(Duration.ofHours(25)),
                NOW.plus(Duration.ofDays(2)), null, null);

        when(auth.findSessionForUpdate("hash"))
                .thenReturn(Optional.of(expired), Optional.of(revoked), Optional.of(idle));

        for (int attempt = 0; attempt < 3; attempt++) {
            assertThatThrownBy(() -> service.refresh("refresh.USUARIO", null))
                    .isInstanceOf(AppException.class);
        }
        verify(auth, never()).createSession(anyLong(), any(), any(), any(), any(), any());
    }

    @Test
    void activeListUsesAbsoluteAndIdleCutoffsAndIdentifiesCurrentSession() {
        var current = new AuthRepository.SessionView(9, NOW.minusSeconds(60),
                NOW.plus(Duration.ofDays(7)), null, "::1", "Chrome", true);
        when(auth.findActiveSessions(eq(7L), eq(9L), eq(NOW), any())).thenReturn(List.of(current));

        assertThat(service.activeSessions(7L, 9L)).containsExactly(current);

        verify(auth).revokeExcessActiveSessions(eq(7L), eq(9L), eq(NOW),
                eq(NOW.minus(Duration.ofHours(24))), eq(5));
        verify(auth).findActiveSessions(7L, 9L, NOW, NOW.minus(Duration.ofHours(24)));
    }

    @Test
    void refreshRotationKeepsTheOriginalAbsoluteExpiration() {
        Instant absoluteExpiration = NOW.plus(Duration.ofDays(2));
        SessionRecord session = new SessionRecord(8, 7, NOW.minusSeconds(60), absoluteExpiration,
                null, null);
        UserAccount user = new UserAccount(7, "user@udea.edu.co", "$argon2id$hash", null,
                "María", "Usuario", "ACTIVO", "es", Set.of("USUARIO"));
        when(auth.findSessionForUpdate("hash")).thenReturn(Optional.of(session));
        when(users.findById(7L)).thenReturn(Optional.of(user));
        when(tokens.generate()).thenReturn("next-refresh");
        when(tokens.sha256("next-refresh.USUARIO")).thenReturn("next-hash");
        when(auth.createSession(eq(7L), eq("next-hash"), eq(NOW), eq(absoluteExpiration), any(), any()))
                .thenReturn(10L);
        when(jwt.issue(user, "USUARIO", 10L)).thenReturn(new JwtService.AccessToken("access", 900));

        var result = service.refresh("refresh.USUARIO", new RequestMetadata("127.0.0.1", "Chrome"));

        assertThat(result.refreshExpiresAt()).isEqualTo(absoluteExpiration);
        verify(auth).revokeSession(8L, NOW, true);
        verify(auth).createSession(7L, "next-hash", NOW, absoluteExpiration, "127.0.0.1", "Chrome");
    }

    @Test
    void logoutOthersRequiresAndPreservesAnActiveCurrentSession() {
        Instant cutoff = NOW.minus(Duration.ofHours(24));
        when(auth.isActiveSession(7L, 9L, NOW, cutoff)).thenReturn(true);
        when(auth.revokeOtherActiveSessions(7L, 9L, NOW, cutoff)).thenReturn(4);

        assertThat(service.logoutOthers(7L, 9L)).isEqualTo(4);
        verify(auth).revokeOtherActiveSessions(7L, 9L, NOW, cutoff);

        assertThatThrownBy(() -> service.logoutOthers(7L, null)).isInstanceOf(AppException.class);
    }
}
