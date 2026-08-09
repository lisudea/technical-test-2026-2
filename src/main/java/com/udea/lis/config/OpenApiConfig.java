package com.udea.lis.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI lisOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("LIS Equipment Management API")
                        .description("REST API for managing LIS laboratory equipment inventory and reservations")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Laboratorio Integrado de Sistemas - LIS")
                                .email("lis@udea.edu.co"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0")));
    }
}
