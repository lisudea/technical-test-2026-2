package com.lis.reservas.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lis.reservas.common.exception.DominioNoAutorizadoException;
import com.lis.reservas.common.exception.ValidacionException;
import com.lis.reservas.config.ReservasProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for {@link GoogleTokenValidator}. Uses the {@link
 * FakeGoogleIdToken} helper to build id_token strings without the real
 * Google signature-verification library.
 */
class GoogleTokenValidatorTest {

    private GoogleTokenValidator validator;

    @BeforeEach
    void setUp() {
        validator = new GoogleTokenValidator(props(true), new ObjectMapper());
    }

    @Test
    void verifiesUdeaTokenReturnsEmailAndNombre() {
        String token = FakeGoogleIdToken.build("juan@udea.edu.co", "Juan Perez", true);

        GoogleTokenValidator.GoogleUserInfo info = validator.verify(token);

        assertThat(info.email()).isEqualTo("juan@udea.edu.co");
        assertThat(info.nombre()).isEqualTo("Juan Perez");
    }

    @Test
    void rejectsNonUdeaDomain() {
        String token = FakeGoogleIdToken.build("juan@gmail.com", "Juan", true);

        assertThatThrownBy(() -> validator.verify(token))
                .isInstanceOf(DominioNoAutorizadoException.class)
                .hasMessageContaining("juan@gmail.com");
    }

    @Test
    void rejectsWhenGoogleSsoDisabled() {
        GoogleTokenValidator disabled = new GoogleTokenValidator(props(false), new ObjectMapper());

        assertThatThrownBy(() -> disabled.verify(
                        FakeGoogleIdToken.build("juan@udea.edu.co", "Juan", true)))
                .isInstanceOf(DominioNoAutorizadoException.class)
                .hasMessageContaining("no configurado");
    }

    @Test
    void rejectsBlankIdToken() {
        assertThatThrownBy(() -> validator.verify("   "))
                .isInstanceOf(ValidacionException.class);
    }

    @Test
    void rejectsMalformedIdToken() {
        assertThatThrownBy(() -> validator.verify(FakeGoogleIdToken.malformed()))
                .isInstanceOf(ValidacionException.class);
    }

    @Test
    void rejectsUnverifiedEmail() {
        String token = FakeGoogleIdToken.build("juan@udea.edu.co", "Juan", false);

        assertThatThrownBy(() -> validator.verify(token))
                .isInstanceOf(DominioNoAutorizadoException.class);
    }

    @Test
    void nombreFallsBackToEmailWhenNameClaimAbsent() {
        String token = FakeGoogleIdToken.build("juan@udea.edu.co", null, true);

        GoogleTokenValidator.GoogleUserInfo info = validator.verify(token);

        assertThat(info.nombre()).isEqualTo("juan@udea.edu.co");
    }

    /** Properties with Google SSO toggled and no role bootstrap configured. */
    private static ReservasProperties props(boolean googleEnabled) {
        return new ReservasProperties(
                java.time.Duration.ofHours(8),
                java.time.Duration.ofMinutes(15),
                new ReservasProperties.Auth(
                        new ReservasProperties.Auth.Google(
                                googleEnabled, "client-id", "udea.edu.co"),
                        new ReservasProperties.Auth.Roles(java.util.List.of(), java.util.List.of())),
                new ReservasProperties.Prestamo(
                        java.time.Duration.ofMinutes(30), java.time.Duration.ofHours(1)),
                new ReservasProperties.Sanciones(7));
    }
}
