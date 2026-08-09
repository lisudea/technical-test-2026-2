package com.udea.lis.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request to create a new user")
public class CreateUserRequest {

    @NotBlank(message = "Name is required")
    @Schema(description = "User full name", example = "Satoru Gojo")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Schema(description = "User email (must be unique)", example = "satoru.gojo@udea.edu.co")
    private String email;
}
