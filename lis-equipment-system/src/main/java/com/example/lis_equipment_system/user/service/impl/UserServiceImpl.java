package com.example.lis_equipment_system.user.service.impl;

import com.example.lis_equipment_system.user.entity.User;
import com.example.lis_equipment_system.user.entity.enumerator.Role;
import com.example.lis_equipment_system.user.repository.UserRepository;
import com.example.lis_equipment_system.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public User findOrCreateByEmail(String email, String name) {
        return userRepository.findByEmail(email)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setEmail(email);
                    newUser.setName(name);
                    newUser.setRole(Role.USER);
                    newUser.setRegistrationDate(LocalDateTime.now());
                    return userRepository.save(newUser);
                });
    }
}