package com.udea.labreservas.dto;

import com.udea.labreservas.entity.Role;

public record UserDTO(
        Integer userId,
        String name,
        String lastName,
        String email,
        Role role
) {
}