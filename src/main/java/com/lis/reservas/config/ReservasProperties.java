package com.lis.reservas.config;

import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/**
 * Domain configuration for the reservation system.
 *
 * <p>Bound from the {@code reservas.*} properties:
 * <pre>
 * reservas:
 *   max-duration: PT8H      # maximum reservation window (default 8h)
 *   min-duration: PT15M     # minimum reservation window (default 15m)
 *   auth:
 *     google:
 *       enabled: false          # Google SSO toggle (bonus-gated)
 *       client-id: ...          # Google OAuth client id
 *       allowed-domain: udea.edu.co # enforced email domain
 * </pre>
 *
 * <p>{@code maxDuration} is the bound used by {@code ReservaService} to
 * reject over-long reservations BEFORE acquiring the {@code FOR UPDATE}
 * lock. The default {@code PT8H} applies even when the property is absent
 * via {@link DefaultValue}.
 *
 * <p>Registered automatically by {@code @ConfigurationPropertiesScan} on the
 * application class.
 */
@ConfigurationProperties(prefix = "reservas")
public record ReservasProperties(
        @DefaultValue("PT8H") Duration maxDuration,
        @DefaultValue("PT15M") Duration minDuration,
        @DefaultValue Auth auth) {

    public record Auth(@DefaultValue Google google) {
        public record Google(
                boolean enabled,
                String clientId,
                @DefaultValue("udea.edu.co") String allowedDomain) {
        }
    }
}