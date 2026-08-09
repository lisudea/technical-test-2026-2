package com.lis.reservas.reserva.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Validation tests for {@link ReservaCreateRequest}. Asserts bean
 * validation annotations only — the temporal business rules (start &lt;
 * end, not in the past, max duration) are validated in {@code ReservaService}.
 */
class ReservaDtoValidationTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void setUp() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void tearDown() {
        if (factory != null) {
            factory.close();
        }
    }

    private static OffsetDateTime atTime(int hour) {
        return OffsetDateTime.of(2026, 12, 1, hour, 0, 0, 0, ZoneOffset.ofHours(-5));
    }

    @Test
    void validRequestPasses() {
        var request = new ReservaCreateRequest("Maria", "maria@udea.edu.co",
                3, atTime(10), atTime(12), "Clase");

        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void blankNombreUsuarioIsRejected() {
        var request = new ReservaCreateRequest(" ", "maria@udea.edu.co",
                3, atTime(10), atTime(12), null);

        assertThat(validator.validate(request))
                .extracting(v -> v.getPropertyPath().toString())
                .contains("nombreUsuario");
    }

    @Test
    void malformedCorreoIsRejected() {
        var request = new ReservaCreateRequest("Maria", "not-an-email",
                3, atTime(10), atTime(12), null);

        assertThat(validator.validate(request))
                .extracting(v -> v.getPropertyPath().toString())
                .contains("correoUsuario");
    }

    @Test
    void nullIdEquipoAndDatesAreRejected() {
        var request = new ReservaCreateRequest("Maria", "maria@udea.edu.co",
                null, null, null, null);

        assertThat(validator.validate(request)).hasSize(3);
        assertThat(validator.validate(request))
                .extracting(v -> v.getPropertyPath().toString())
                .contains("idEquipo", "fechaHoraInicio", "fechaHoraFin");
    }
}