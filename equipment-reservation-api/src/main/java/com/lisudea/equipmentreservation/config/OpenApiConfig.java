package com.lisudea.equipmentreservation.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI equipmentReservationOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Equipment Reservation API")
                        .description("API REST para gestionar equipos y reservas del laboratorio LIS")
                        .version("1.0.0"));
    }
}
