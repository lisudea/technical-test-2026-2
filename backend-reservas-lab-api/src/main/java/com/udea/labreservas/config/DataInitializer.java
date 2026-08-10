package com.udea.labreservas.config;

import com.udea.labreservas.entity.EquipmentCategory;
import com.udea.labreservas.entity.EquipmentStatus;
import com.udea.labreservas.entity.LabEquipment;
import com.udea.labreservas.entity.Role;
import com.udea.labreservas.entity.User;
import com.udea.labreservas.repository.EquipmentCategoryRepository;
import com.udea.labreservas.repository.LabEquipmentRepository;
import com.udea.labreservas.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final UserRepository userRepository;
    private final EquipmentCategoryRepository categoryRepository;
    private final LabEquipmentRepository equipmentRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner seedData() {
        return args -> {
            if (userRepository.count() == 0) {
                User admin = new User();
                admin.setName("Administrador");
                admin.setLastName("Sistemas");
                admin.setEmail("admin@udea.edu.co");
                admin.setPassword(passwordEncoder.encode("Admin1234"));
                admin.setRole(Role.ADMINISTRADOR);
                userRepository.save(admin);

                User usuario = new User();
                usuario.setName("Usuario");
                usuario.setLastName("Prueba");
                usuario.setEmail("estudiante@udea.edu.co");
                usuario.setPassword(passwordEncoder.encode("Usuario1234"));
                usuario.setRole(Role.USUARIO);
                userRepository.save(usuario);
            }

            if (categoryRepository.count() > 0) {
                return;
            }

            EquipmentCategory computacion = category("Computacion");
            EquipmentCategory electronica = category("Electronica");
            EquipmentCategory redes = category("Redes y comunicaciones");
            EquipmentCategory embebidos = category("Sistemas embebidos");

            equipment(computacion, "ThinkPad T470", "SER-0003", EquipmentStatus.EN_MANTENIMIENTO);
            equipment(computacion, "MacBook Pro 14", "SER-0004", EquipmentStatus.DISPONIBLE);
            equipment(electronica, "Osciloscopio Rigol DS-1000Z", "SER-0001", EquipmentStatus.DISPONIBLE);
            equipment(electronica, "Multimetro Fluke 87V", "SER-0002", EquipmentStatus.DISPONIBLE);
            equipment(redes, "Router Cisco 2901", "AA:BB:CC:DD:EE:01", EquipmentStatus.DISPONIBLE);
            equipment(redes, "Switch HP 2450", "AA:BB:CC:DD:EE:02", EquipmentStatus.EN_PRESTAMO);
            equipment(embebidos, "Raspberry Pi 4 Model B", "SER-0005", EquipmentStatus.DISPONIBLE);
        };
    }

    private EquipmentCategory category(String name) {
        EquipmentCategory category = new EquipmentCategory();
        category.setCategoryName(name);
        return categoryRepository.save(category);
    }

    private void equipment(EquipmentCategory category, String name, String mac, EquipmentStatus status) {
        LabEquipment equipment = new LabEquipment();
        equipment.setEquipmentName(name);
        equipment.setMacNumber(mac);
        equipment.setStatus(status);
        equipment.setCategory(category);
        equipmentRepository.save(equipment);
    }
}