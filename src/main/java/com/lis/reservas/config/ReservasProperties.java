package com.lis.reservas.config;

import com.lis.reservas.usuario.entity.Rol;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Domain configuration for the reservation system.
 *
 * <pre>
 * reservas:
 *   max-duration: PT8H      # maximum reservation window (default 8h)
 *   min-duration: PT15M     # minimum reservation window (default 15m)
 *   auth:
 *     google:
 *       enabled: false              # Google SSO toggle (bonus-gated)
 *       client-id: ...              # Google OAuth client id
 *       allowed-domain: udea.edu.co # enforced email domain
 *     roles:
 *       admins:     [ ... ]         # emails bootstrapped to ADMIN on sign-in
 *       auxiliares: [ ... ]         # emails bootstrapped to AUXILIAR on sign-in
 *   prestamo:
 *     tolerancia-entrega: PT30M     # early hand-over grace before the window
 *     margen-no-reclamado: PT1H     # wait before a no-show can be declared
 *   sanciones:
 *     dias-por-no-reclamar: 7       # automatic sanction length for a no-show
 * </pre>
 *
 * <p>{@code maxDuration} is the bound used by {@code ReservaService} to
 * reject over-long reservations BEFORE acquiring the {@code FOR UPDATE}
 * lock.
 *
 * <p>The {@code roles} lists solve the bootstrap problem: role assignment is
 * an ADMIN-only endpoint, so a brand-new database would have nobody able to
 * grant the first role. Listing an email here promotes it on sign-in, which
 * makes the first ADMIN an environment-variable decision instead of manual
 * SQL against production. Promotion is one-way — see {@link #rolBootstrap} —
 * so this never silently demotes someone an ADMIN promoted through the API.
 *
 * <p>Registered automatically by {@code @ConfigurationPropertiesScan} on the
 * application class.
 */
@ConfigurationProperties(prefix = "reservas")
public record ReservasProperties(
        @DefaultValue("PT8H") Duration maxDuration,
        @DefaultValue("PT15M") Duration minDuration,
        @DefaultValue Auth auth,
        @DefaultValue Prestamo prestamo,
        @DefaultValue Sanciones sanciones) {

    public record Auth(@DefaultValue Google google, @DefaultValue Roles roles) {

        public record Google(
                boolean enabled,
                String clientId,
                @DefaultValue("udea.edu.co") String allowedDomain) {
        }

        /**
         * Emails promoted on sign-in. Matching is case-insensitive because
         * Google may echo a differently-cased address than the one typed here.
         */
        public record Roles(List<String> admins, List<String> auxiliares) {

            public Roles {
                admins = normalize(admins);
                auxiliares = normalize(auxiliares);
            }

            private static List<String> normalize(List<String> raw) {
                return raw == null
                        ? List.of()
                        : raw.stream()
                             .filter(e -> e != null && !e.isBlank())
                             .map(e -> e.trim().toLowerCase(Locale.ROOT))
                             .toList();
            }
        }
    }

    /** Loan-desk timing rules applied by the auxiliar endpoints. */
    public record Prestamo(
            @DefaultValue("PT30M") Duration toleranciaEntrega,
            @DefaultValue("PT1H") Duration margenNoReclamado) {
    }

    /** Sanction policy. */
    public record Sanciones(@DefaultValue("7") int diasPorNoReclamar) {
    }

    /**
     * The role this email is bootstrapped to by configuration, if any.
     *
     * <p>{@code admins} wins over {@code auxiliares} when an address appears
     * in both lists — the more privileged intent is the explicit one.
     *
     * @return the configured role, or empty when the email is not listed.
     */
    public Optional<Rol> rolBootstrap(String correo) {
        if (correo == null || correo.isBlank() || auth == null || auth.roles() == null) {
            return Optional.empty();
        }
        String needle = correo.trim().toLowerCase(Locale.ROOT);
        if (auth.roles().admins().contains(needle)) {
            return Optional.of(Rol.ADMIN);
        }
        if (auth.roles().auxiliares().contains(needle)) {
            return Optional.of(Rol.AUXILIAR);
        }
        return Optional.empty();
    }
}
