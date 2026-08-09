package co.edu.udea.lis.lisource.auth.application;

import co.edu.udea.lis.lisource.audit.application.AuditPublisher;
import co.edu.udea.lis.lisource.auth.api.AuthResponse;
import co.edu.udea.lis.lisource.auth.domain.*;
import co.edu.udea.lis.lisource.auth.infrastructure.AuthRepository;
import co.edu.udea.lis.lisource.configuration.application.ConfigurationService;
import co.edu.udea.lis.lisource.shared.exception.AppException;
import co.edu.udea.lis.lisource.shared.exception.ErrorCode;
import co.edu.udea.lis.lisource.shared.security.JwtService;
import co.edu.udea.lis.lisource.shared.security.TokenCodec;
import co.edu.udea.lis.lisource.shared.util.RequestMetadata;
import co.edu.udea.lis .lisource.user.api.UserResponse;
import co.edu.udea.lis.lisource.user.domain.UserAccount;
import co.edu.udea.lis.lisource.user.infrastructure.UserRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository users;
    private final AuthRepository auth;
    private final ConfigurationService configuration;
    private final PasswordEncoder passwords;
    private final JwtService jwt;
    private final TokenCodec tokens;
    private final GoogleTokenVerifier google;
    private final EmailDomainPolicy emailPolicy;
    private final PasswordRecoveryNotifier notifier;
    private final AuditPublisher audit;
    private final Clock clock;

    public AuthService(UserRepository users, AuthRepository auth, ConfigurationService configuration,
                       PasswordEncoder passwords, JwtService jwt, TokenCodec tokens,
                       GoogleTokenVerifier google, EmailDomainPolicy emailPolicy,
                       PasswordRecoveryNotifier notifier, AuditPublisher audit, Clock clock) {
        this.users = users;
        this.auth = auth;
        this.configuration = configuration;
        this.passwords = passwords;
        this.jwt = jwt;
        this.tokens = tokens;
        this.google = google;
        this.emailPolicy = emailPolicy;
        this.notifier = notifier;
        this.audit = audit;
        this.clock = clock;
    }

    @Transactional
    public AuthResult login(String email, String password, RequestMetadata metadata) {
        String normalized = email == null ? "" : email.trim().toLowerCase(java.util.Locale.ROOT);
        UserAccount user = users.findByEmail(normalized).orElse(null);
        if (user == null || user.passwordHash() == null || !passwords.matches(password, user.passwordHash())) {
            audit.rejection("LOGIN_FALLIDO", user == null ? null : user.id(), null,
                    "Local login rejected", Map.of("reasonCode", "INVALID_CREDENTIALS", "email", normalized));
            throw new AppException(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_CREDENTIALS,
                    "Email or password is incorrect.");
        }
        requireActive(user);
        users.updateLastAccess(user.id());
        UserAccount updated = requiredUser(user.id());
        audit.success("LOGIN_LOCAL_EXITOSO", updated.id(), updated.id(), "Local login succeeded", null,
                Map.of("email", updated.email()));
        return beginAuthentication(updated, metadata);
    }

    @Transactional
    public AuthResult loginGoogle(String credential, RequestMetadata metadata) {
        GoogleIdentity identity;
        try {
            identity = google.verify(credential);
        } catch (AppException exception) {
            audit.rejection("ERROR_INTEGRACION_GOOGLE", null, null,
                    "Google authentication failed", Map.of("reasonCode", exception.code().name()));
            throw exception;
        }
        String email = emailPolicy.requireInstitutional(identity.email());
        UserAccount bySubject = users.findByGoogleSub(identity.subject()).orElse(null);
        UserAccount byEmail = users.findByEmail(email).orElse(null);
        UserAccount user;
        if (bySubject != null) {
            if (!bySubject.email().equals(email)) throw googleFailure();
            user = bySubject;
        } else if (byEmail != null) {
            if (byEmail.googleSub() != null && !byEmail.googleSub().equals(identity.subject())) throw googleFailure();
            users.linkGoogleSub(byEmail.id(), identity.subject());
            user = requiredUser(byEmail.id());
        } else {
            String language = configuration.stringOr(ConfigurationService.DEFAULT_LANGUAGE, "es");
            long id = users.createGoogleUser(email, identity.subject(), identity.firstName(), identity.lastName(), language);
            users.assignBaseRole(id);
            user = requiredUser(id);
            audit.success("CREAR_USUARIO_GOOGLE", id, id, "Google user created", null,
                    Map.of("email", email, "source", "GOOGLE"));
        }
        requireActive(user);
        users.updateLastAccess(user.id());
        UserAccount updated = requiredUser(user.id());
        audit.success("LOGIN_GOOGLE_EXITOSO", updated.id(), updated.id(), "Google login succeeded", null,
                Map.of("email", email));
        return beginAuthentication(updated, metadata);
    }

    @Transactional
    public AuthResult selectRole(String selectionToken, String role, RequestMetadata metadata) {
        JwtService.RoleSelectionToken selection = jwt.decodeRoleSelection(selectionToken);
        UserAccount user = requiredUser(selection.userId());
        requireActive(user);
        String normalizedRole = normalizeRole(role);
        if (!selection.availableRoles().contains(normalizedRole) || !user.roles().contains(normalizedRole)) {
            throw new AppException(HttpStatus.FORBIDDEN, ErrorCode.ROLE_NOT_ASSIGNED,
                    "The selected role is not actively assigned to this user.");
        }
        audit.success("SELECCIONAR_ROL", user.id(), user.id(), "Active role selected", null,
                Map.of("activeRole", normalizedRole));
        return issue(user, normalizedRole, metadata);
    }

    @Transactional
    public AuthResult switchRole(long userId, String rawRefreshToken, String role, RequestMetadata metadata) {
        UserAccount user = requiredUser(userId);
        requireActive(user);
        String normalizedRole = normalizeRole(role);
        if (!user.roles().contains(normalizedRole)) {
            throw new AppException(HttpStatus.FORBIDDEN, ErrorCode.ROLE_NOT_ASSIGNED,
                    "The selected role is not actively assigned to this user.");
        }
        Instant refreshExpiresAt = replacePresentedSession(rawRefreshToken, userId, Instant.now(clock));
        audit.success("CAMBIAR_ROL", user.id(), user.id(), "Active role switched", null,
                Map.of("activeRole", normalizedRole));
        return issue(user, normalizedRole, metadata, refreshExpiresAt);
    }

    @Transactional
    public AuthResult refresh(String rawRefreshToken, RequestMetadata metadata) {
        Instant now = Instant.now(clock);
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) throw refreshInvalid(ErrorCode.REFRESH_TOKEN_INVALID);
        SessionRecord session = auth.findSessionForUpdate(tokens.sha256(rawRefreshToken))
                .orElseThrow(() -> refreshInvalid(ErrorCode.REFRESH_TOKEN_INVALID));
        if (session.revoked()) throw refreshInvalid(ErrorCode.REFRESH_TOKEN_INVALID);
        if (session.expired(now)) throw refreshInvalid(ErrorCode.REFRESH_TOKEN_EXPIRED);
        if (session.inactive(now, sessionIdleTimeout())) throw refreshInvalid(ErrorCode.REFRESH_TOKEN_EXPIRED);
        UserAccount user = requiredUser(session.userId());
        requireActive(user);
        String activeRole = roleFromRefreshToken(rawRefreshToken, user.roles());
        if (!user.roles().contains(activeRole)) {
            auth.revokeSession(session.id(), now, false);
            throw new AppException(HttpStatus.UNAUTHORIZED, ErrorCode.ROLE_NOT_AVAILABLE,
                    "The active role is no longer available.");
        }
        auth.revokeSession(session.id(), now, true);
        AuthResult result = issue(user, activeRole, metadata, session.expiresAt());
        audit.success("REFRESH_TOKEN", user.id(), session.id(), "Refresh token rotated", null,
                Map.of("newSessionId", result.sessionId()));
        return result;
    }

    @Transactional
    public void logout(String rawRefreshToken, long userId) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            auth.findSessionForUpdate(tokens.sha256(rawRefreshToken))
                    .filter(session -> session.userId() == userId)
                    .ifPresent(session -> auth.revokeSession(session.id(), Instant.now(clock), false));
        }
        audit.success("CERRAR_SESION", userId, userId, "Session closed", null, null);
    }

    @Transactional
    public int logoutAll(long userId) {
        int count = auth.revokeAll(userId, Instant.now(clock));
        audit.success("CERRAR_TODAS_SESIONES", userId, userId, "All sessions closed", null,
                Map.of("revokedSessions", count));
        return count;
    }

    @Transactional
    public List<AuthRepository.SessionView> activeSessions(long userId, Long currentSessionId) {
        Instant now = Instant.now(clock);
        Instant idleCutoff = now.minus(sessionIdleTimeout());
        int revoked = auth.revokeExcessActiveSessions(userId,
                currentSessionId == null ? 0L : currentSessionId,
                now, idleCutoff, maximumActiveSessions());
        auditSessionLimit(userId, currentSessionId, revoked);
        return auth.findActiveSessions(userId, currentSessionId, now, idleCutoff);
    }

    @Transactional
    public boolean revokeSession(long userId, long sessionId) {
        Instant now = Instant.now(clock);
        int changed = auth.revokeOwnedActiveSession(userId, sessionId, now,
                now.minus(sessionIdleTimeout()));
        if (changed == 0) {
            throw new AppException(HttpStatus.NOT_FOUND, ErrorCode.RESOURCE_NOT_FOUND,
                    "The active session was not found.");
        }
        audit.success("CERRAR_SESION", userId, sessionId, "Session revoked", null, null);
        return true;
    }

    @Transactional
    public int logoutOthers(long userId, Long currentSessionId) {
        Instant now = Instant.now(clock);
        Instant idleCutoff = now.minus(sessionIdleTimeout());
        if (currentSessionId == null || !auth.isActiveSession(userId, currentSessionId, now, idleCutoff)) {
            throw refreshInvalid(ErrorCode.REFRESH_TOKEN_INVALID);
        }
        int count = auth.revokeOtherActiveSessions(userId, currentSessionId, now, idleCutoff);
        audit.success("CERRAR_TODAS_SESIONES", userId, currentSessionId,
                "All other active sessions closed", null, Map.of("revokedSessions", count));
        return count;
    }

    @Transactional
    public void forgotPassword(String email, RequestMetadata metadata) {
        String normalized = email == null ? "" : email.trim().toLowerCase(java.util.Locale.ROOT);
        UserAccount user = users.findByEmail(normalized).orElse(null);
        if (user != null && user.active() && user.passwordHash() != null) {
            Instant now = Instant.now(clock);
            String raw = tokens.generate();
            int minutes = configuration.integerOr(ConfigurationService.RECOVERY_MINUTES, 30);
            auth.revokePendingRecoveries(user.id(), now);
            long id = auth.createRecovery(user.id(), tokens.sha256(raw), now,
                    now.plus(Duration.ofMinutes(minutes)), metadata.ip(), metadata.userAgent());
            audit.success("SOLICITAR_RECUPERACION_PASSWORD", user.id(), id,
                    "Password recovery requested", null, Map.of("email", user.email()));
            try {
                notifier.notify(user.email(), raw);
            } catch (RuntimeException exception) {
                audit.rejection("ERROR_ENVIO_CORREO", user.id(), id,
                        "Password recovery email delivery failed", Map.of("reasonCode", "EMAIL_DELIVERY_FAILED"));
                // Preserve the anti-enumeration response while recording a sanitized operational event.
            }
        } else {
            audit.rejection("SOLICITAR_RECUPERACION_PASSWORD", null, null,
                    "Password recovery requested", Map.of("email", normalized, "accountMatched", false));
        }
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        validateNewPassword(newPassword);
        Instant now = Instant.now(clock);
        RecoveryRecord recovery = auth.findRecoveryForUpdate(tokens.sha256(rawToken == null ? "" : rawToken))
                .orElseThrow(() -> refreshInvalid(ErrorCode.REFRESH_TOKEN_INVALID));
        if (!recovery.usable(now)) throw refreshInvalid(ErrorCode.REFRESH_TOKEN_INVALID);
        auth.markRecoveryUsed(recovery.id(), now);
        auth.revokePendingRecoveries(recovery.userId(), now);
        users.updatePassword(recovery.userId(), passwords.encode(newPassword));
        auth.revokeAll(recovery.userId(), now);
        audit.success("RESTABLECER_PASSWORD", recovery.userId(), recovery.id(),
                "Password reset completed", null, null);
    }

    @Transactional
    public void setPassword(long userId, String newPassword) {
        validateNewPassword(newPassword);
        UserAccount user = requiredUser(userId);
        if (user.passwordHash() != null) throw new AppException(HttpStatus.CONFLICT,
                ErrorCode.VALIDATION_ERROR, "A local password is already configured.");
        users.updatePassword(userId, passwords.encode(newPassword));
        auth.revokeAll(userId, Instant.now(clock));
        audit.success("CONFIGURAR_PASSWORD", userId, userId, "Local password configured", null, null);
    }

    @Transactional
    public void changePassword(long userId, String oldPassword, String newPassword) {
        validateNewPassword(newPassword);
        UserAccount user = requiredUser(userId);
        if (user.passwordHash() == null || !passwords.matches(oldPassword, user.passwordHash())) {
            throw new AppException(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_CREDENTIALS,
                    "Current password is incorrect.");
        }
        users.updatePassword(userId, passwords.encode(newPassword));
        auth.revokeAll(userId, Instant.now(clock));
        audit.success("CAMBIAR_PASSWORD", userId, userId, "Password changed", null, null);
    }

    private AuthResult beginAuthentication(UserAccount user, RequestMetadata metadata) {
        List<String> roles = user.roles().stream().sorted().toList();
        if (roles.isEmpty()) {
            throw new AppException(HttpStatus.FORBIDDEN, ErrorCode.ROLE_NOT_AVAILABLE,
                    "The user has no active role.");
        }
        if (roles.size() > 1) {
            return new AuthResult(AuthResponse.selectionRequired(roles, jwt.issueRoleSelection(user)),
                    null, null, 0);
        }
        return issue(user, roles.getFirst(), metadata, null);
    }

    private AuthResult issue(UserAccount user, String activeRole, RequestMetadata metadata) {
        return issue(user, activeRole, metadata, null);
    }

    private AuthResult issue(UserAccount user, String activeRole, RequestMetadata metadata,
                             Instant absoluteExpiresAt) {
        Instant now = Instant.now(clock);
        String rawRefresh = tokens.generate() + "." + activeRole;
        int days = configuration.integerOr(ConfigurationService.REFRESH_DAYS, 7);
        Instant refreshExpiresAt = absoluteExpiresAt == null
                ? now.plus(Duration.ofDays(days)) : absoluteExpiresAt;
        long sessionId = auth.createSession(user.id(), tokens.sha256(rawRefresh), now, refreshExpiresAt,
                metadata.ip(), metadata.userAgent());
        Instant idleCutoff = now.minus(sessionIdleTimeout());
        int revoked = auth.revokeExcessActiveSessions(user.id(), sessionId, now, idleCutoff,
                maximumActiveSessions());
        auditSessionLimit(user.id(), sessionId, revoked);
        JwtService.AccessToken access = jwt.issue(user, activeRole, sessionId);
        return new AuthResult(AuthResponse.authenticated(access.value(), access.expiresInSeconds(),
                UserResponse.from(user, activeRole)), rawRefresh, refreshExpiresAt, sessionId);
    }

    private Instant replacePresentedSession(String rawRefreshToken, long userId, Instant now) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw refreshInvalid(ErrorCode.REFRESH_TOKEN_INVALID);
        }
        SessionRecord session = auth.findSessionForUpdate(tokens.sha256(rawRefreshToken))
                .filter(value -> value.userId() == userId)
                .orElseThrow(() -> refreshInvalid(ErrorCode.REFRESH_TOKEN_INVALID));
        if (session.revoked()) throw refreshInvalid(ErrorCode.REFRESH_TOKEN_INVALID);
        if (session.expired(now) || session.inactive(now, sessionIdleTimeout())) {
            throw refreshInvalid(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }
        auth.revokeSession(session.id(), now, false);
        return session.expiresAt();
    }

    private Duration sessionIdleTimeout() {
        int configured = configuration.integerOr(ConfigurationService.SESSION_IDLE_HOURS, 24);
        return Duration.ofHours(configured > 0 ? configured : 24);
    }

    private int maximumActiveSessions() {
        int configured = configuration.integerOr(ConfigurationService.MAX_ACTIVE_SESSIONS, 5);
        return configured > 0 ? configured : 5;
    }

    private void auditSessionLimit(long userId, Long currentSessionId, int revoked) {
        if (revoked > 0) {
            audit.success("CERRAR_TODAS_SESIONES", userId, currentSessionId,
                    "Oldest active sessions closed by session limit", null,
                    Map.of("revokedSessions", revoked, "reason", "ACTIVE_SESSION_LIMIT"));
        }
    }

    private String roleFromRefreshToken(String rawRefreshToken, Set<String> roles) {
        int separator = rawRefreshToken == null ? -1 : rawRefreshToken.lastIndexOf('.');
        if (separator > 0 && separator < rawRefreshToken.length() - 1) {
            return normalizeRole(rawRefreshToken.substring(separator + 1));
        }
        if (roles.size() == 1) return roles.iterator().next();
        throw new AppException(HttpStatus.UNAUTHORIZED, ErrorCode.ROLE_NOT_AVAILABLE,
                "The active role cannot be restored. Sign in and select a role again.");
    }

    private String normalizeRole(String role) {
        String normalized = role == null ? "" : role.trim().toUpperCase(java.util.Locale.ROOT);
        if (!normalized.equals("USUARIO") && !normalized.equals("ADMINISTRADOR")) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.ROLE_NOT_AVAILABLE,
                    "The selected role is not supported.");
        }
        return normalized;
    }

    private UserAccount requiredUser(long id) {
        return users.findById(id).orElseThrow(() -> new AppException(HttpStatus.UNAUTHORIZED,
                ErrorCode.INVALID_CREDENTIALS, "The user account is unavailable."));
    }

    private void requireActive(UserAccount user) {
        if (!user.active()) {
            audit.rejection("LOGIN_FALLIDO", user.id(), user.id(), "Inactive account rejected",
                    Map.of("reasonCode", "ACCOUNT_INACTIVE"));
            throw new AppException(HttpStatus.FORBIDDEN, ErrorCode.ACCOUNT_INACTIVE,
                    "The user account is inactive.");
        }
    }

    private void validateNewPassword(String password) {
        if (password == null || password.length() < 12 || password.length() > 128
                || password.chars().noneMatch(Character::isUpperCase)
                || password.chars().noneMatch(Character::isLowerCase)
                || password.chars().noneMatch(Character::isDigit)) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.VALIDATION_ERROR,
                    "Password must contain 12-128 characters, uppercase, lowercase and a number.");
        }
    }

    private AppException refreshInvalid(ErrorCode code) {
        HttpStatus status = code == ErrorCode.REFRESH_TOKEN_EXPIRED ? HttpStatus.UNAUTHORIZED : HttpStatus.UNAUTHORIZED;
        return new AppException(status, code, "Refresh or recovery token is invalid, expired or revoked.");
    }

    private AppException googleFailure() {
        return new AppException(HttpStatus.UNAUTHORIZED, ErrorCode.GOOGLE_AUTHENTICATION_FAILED,
                "Google authentication could not be completed.");
    }

    public record AuthResult(AuthResponse response, String refreshToken, Instant refreshExpiresAt, long sessionId) {}
}
