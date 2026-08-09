package com.lis.reservas.categoria.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Validation tests for {@link CategoriaRequest}.
 */
class CategoriaDtoValidationTest {

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

    @Test
    void blankNombreIsRejected() {
        var request = new CategoriaRequest("  ", "desc");

        Set<ConstraintViolation<CategoriaRequest>> violations = validator.validate(request);

        assertThat(violations).hasSize(1);
        assertThat(violations).extracting(v -> v.getPropertyPath().toString())
                .contains("nombre");
    }

    @Test
    void validRequestPasses() {
        var request = new CategoriaRequest("VR", "Cascos de realidad virtual");

        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void overlongNombreIsRejected() {
        var request = new CategoriaRequest("x".repeat(81), null);

        assertThat(validator.validate(request)).extracting(ConstraintViolation::getPropertyPath)
                .anyMatch(p -> "nombre".equals(p.toString()));
    }
}