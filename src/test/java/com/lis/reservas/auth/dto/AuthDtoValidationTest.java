package com.lis.reservas.auth.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import com.lis.reservas.usuario.entity.Rol;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Validation tests for {@link GoogleAuthRequest}.
 */
class AuthDtoValidationTest {

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
    void blankIdTokenIsRejected() {
        var request = new GoogleAuthRequest("");

        assertThat(validator.validate(request)).hasSize(1);
    }

    @Test
    void validIdTokenPasses() {
        var request = new GoogleAuthRequest("eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature");

        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void tokenResponseAndPerfilResponseArePlainDataHolders() {
        var token = new TokenResponse("abc.def.ghi", "Bearer", 1800L);
        assertThat(token.token()).isEqualTo("abc.def.ghi");
        assertThat(token.tipo()).isEqualTo("Bearer");
        assertThat(token.expiresIn()).isEqualTo(1800L);

        var perfil = new PerfilResponse("Maria", "maria@udea.edu.co", Rol.ESTUDIANTE);
        assertThat(perfil.nombre()).isEqualTo("Maria");
        assertThat(perfil.correo()).isEqualTo("maria@udea.edu.co");
    }
}