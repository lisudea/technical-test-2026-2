package com.example.lis_equipment_system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LisEquipmentSystemApplication {

	public static void main(String[] args) {
		SpringApplication.run(LisEquipmentSystemApplication.class, args);
	}

}
