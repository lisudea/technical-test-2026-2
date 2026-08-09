package com.udea.lis.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "User information response")
public class UserResponse {

    @Schema(description = "User ID", example = "1")
    private Long id;

    @Schema(description = "User full name", example = "Satoru Gojo")
    private String name;

    @Schema(description = "User email", example = "satoru.gojo@udea.edu.co")
    private String email;

    @Schema(description = "Account creation timestamp")
    private LocalDateTime createdAt;
}
