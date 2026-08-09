package com.lis.reservas.equipo.dto;

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
 * Validation tests for the equipo request DTOs. Uses the Jakarta
 * {@link Validator} directly (no Spring context) to assert that
 * {@code @NotBlank}/{@code @NotNull}/{@code @Size} constraints fire on
 * invalid input and pass on valid input.
 */
class EquipoDtoValidationTest {

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
    void createRequestWithBlankNombreAndNullCategoriaIsRejected() {
        var request = new EquipoCreateRequest("  ", "SN-1", null, "desc", null);

        Set<ConstraintViolation<EquipoCreateRequest>> violations = validator.validate(request);

        assertThat(violations).hasSize(2);
        assertThat(violations).extracting(v -> v.getPropertyPath().toString())
                .contains("nombre", "idCategoria");
    }

    @Test
    void createRequestWithValidFieldsPasses() {
        var request = new EquipoCreateRequest("Arduino Uno", "ARD-001",
                "AA:BB:CC:DD:EE:FF", "Kit", 1);

        Set<ConstraintViolation<EquipoCreateRequest>> violations = validator.validate(request);

        assertThat(violations).isEmpty();
    }

    @Test
    void createRequestRejectsOverlongNombre() {
        var longNombre = "x".repeat(151);
        var request = new EquipoCreateRequest(longNombre, null, null, null, 1);

        Set<ConstraintViolation<EquipoCreateRequest>> violations = validator.validate(request);

        assertThat(violations).extracting(ConstraintViolation::getPropertyPath)
                .anyMatch(p -> "nombre".equals(p.toString()));
    }

    @Test
    void updateRequestRequiresNombreNumeroSerieAndCategoria() {
        var request = new EquipoUpdateRequest("", "", null, null, null);

        Set<ConstraintViolation<EquipoUpdateRequest>> violations = validator.validate(request);

        assertThat(violations).hasSize(3);
        assertThat(violations).extracting(v -> v.getPropertyPath().toString())
                .contains("nombre", "numeroSerie", "idCategoria");
    }

    @Test
    void updateRequestWithValidFieldsPasses() {
        var request = new EquipoUpdateRequest("Arduino Uno", "ARD-001",
                "AA:BB:CC:DD:EE:FF", "Kit", 1);

        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void estadoPatchRequestRejectsNullEstado() {
        var request = new EstadoPatchRequest(null);

        assertThat(validator.validate(request)).hasSize(1);
    }

    @Test
    void estadoPatchRequestAcceptsValidEstado() {
        var request = new EstadoPatchRequest(
                com.lis.reservas.equipo.entity.EstadoEquipo.MANTENIMIENTO);

        assertThat(validator.validate(request)).isEmpty();
    }
}