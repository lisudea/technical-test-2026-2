package com.udea.lis.service;

import com.udea.lis.dto.request.CreateUserRequest;
import com.udea.lis.dto.response.UserResponse;
import com.udea.lis.entity.User;
import com.udea.lis.exception.DuplicateResourceException;
import com.udea.lis.exception.ResourceNotFoundException;
import com.udea.lis.mapper.UserMapper;
import com.udea.lis.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email '" + request.getEmail() + "' already registered");
        }

        User user = userMapper.toEntity(request);
        user = userRepository.save(user);
        return userMapper.toResponse(user);
    }

    public UserResponse getUser(Long id) {
        User user = findUserById(id);
        return userMapper.toResponse(user);
    }

    public User findUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }

    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User with email '" + email + "' not found"));
        return userMapper.toResponse(user);
    }
}
