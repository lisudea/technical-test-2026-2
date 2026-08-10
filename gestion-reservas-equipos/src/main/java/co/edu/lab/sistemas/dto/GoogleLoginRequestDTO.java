package co.edu.lab.sistemas.dto;

import jakarta.validation.constraints.NotBlank;

public record GoogleLoginRequestDTO(
        @NotBlank String idToken
) {}