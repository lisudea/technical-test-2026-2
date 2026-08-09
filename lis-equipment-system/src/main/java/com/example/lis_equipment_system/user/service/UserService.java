package com.example.lis_equipment_system.user.service;

import com.example.lis_equipment_system.user.entity.User;

public interface UserService {

    User findOrCreateByEmail(String email, String name);
}