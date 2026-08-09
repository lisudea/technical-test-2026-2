package co.edu.udea.lis.lisource.auth.domain;

import java.time.Duration;
import java.time.Instant;

public record SessionRecord(long id, long userId, Instant createdAt, Instant expiresAt,
                            Instant lastUsedAt, Instant revokedAt) {
    public boolean revoked() { return revokedAt != null; }
    public boolean expired(Instant now) { return !expiresAt.isAfter(now); }
    public boolean inactive(Instant now, Duration timeout) {
        Instant activity = lastUsedAt == null ? createdAt : lastUsedAt;
        return !activity.plus(timeout).isAfter(now);
    }
}
