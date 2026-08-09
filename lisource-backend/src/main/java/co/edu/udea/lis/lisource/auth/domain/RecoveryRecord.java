package co.edu.udea.lis.lisource.auth.domain;

import java.time.Instant;

public record RecoveryRecord(long id, long userId, Instant requestedAt, Instant expiresAt,
                             Instant usedAt, Instant revokedAt) {
    public boolean usable(Instant now) {
        return usedAt == null && revokedAt == null && expiresAt.isAfter(now);
    }
}

