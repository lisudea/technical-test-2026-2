package co.edu.udea.lis.lisource.auth.application;

import static org.assertj.core.api.Assertions.assertThat;

import co.edu.udea.lis.lisource.auth.domain.SessionRecord;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class SessionRecordTest {
    private static final Instant NOW = Instant.parse("2030-01-02T12:00:00Z");

    @Test
    void distinguishesAbsoluteExpiryRevocationAndIdleTimeout() {
        SessionRecord active = new SessionRecord(1, 7, NOW.minusSeconds(3600), NOW.plusSeconds(60),
                null, null);
        SessionRecord idle = new SessionRecord(2, 7, NOW.minus(Duration.ofHours(25)),
                NOW.plus(Duration.ofDays(2)), null, null);
        SessionRecord expired = new SessionRecord(3, 7, NOW.minusSeconds(60), NOW, null, null);
        SessionRecord revoked = new SessionRecord(4, 7, NOW.minusSeconds(60), NOW.plusSeconds(60),
                null, NOW.minusSeconds(1));

        assertThat(active.expired(NOW)).isFalse();
        assertThat(active.inactive(NOW, Duration.ofHours(24))).isFalse();
        assertThat(idle.inactive(NOW, Duration.ofHours(24))).isTrue();
        assertThat(expired.expired(NOW)).isTrue();
        assertThat(revoked.revoked()).isTrue();
    }
}
