package com.udea.labreservas.dto;

public record GoogleLoginRequest(
    String email,
    String name,
    String givenName,
    String familyName
) {
}
