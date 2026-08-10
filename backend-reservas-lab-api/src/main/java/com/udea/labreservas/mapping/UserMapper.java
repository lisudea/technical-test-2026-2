package com.udea.labreservas.mapping;

import com.udea.labreservas.dto.UserDTO;
import com.udea.labreservas.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserDTO toDto(User user) {
        if (user == null) {
            return null;
        }
        return new UserDTO(
                user.getUserId(),
                user.getName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole()
        );
    }
}