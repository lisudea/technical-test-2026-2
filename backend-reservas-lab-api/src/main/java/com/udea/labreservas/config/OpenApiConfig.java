package com.udea.labreservas.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("API de Reservas de Equipos de Laboratorio de Sistemas")
                        .description("""
                                API REST para la gestion de equipos y reservas del laboratorio de sistemas de la UdeA.

                                Autenticacion:
                                - Registro/login por correo institucional (@udea.edu.co) que entrega un JWT (Bearer).
                                - OAuth2 con cuenta de Google (mismo dominio institucional) que tambien entrega un JWT.
                                - Solo el rol ADMINISTRADOR puede registrar, actualizar o eliminar equipos.

                                Regla de negocio: no se permite crear una reserva si su horario se traslapa con
                                otra reserva existente del mismo equipo, Si ya se encuentra en prestamo o está en 
                                mantenimiento (HTTP 409)
                                """)
                        .version("1.0.0")
                        .contact(new Contact().name("Laboratorio de Sistemas").email("lab@udea.edu.co")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .components(new Components().addSecuritySchemes("bearerAuth",
                        new SecurityScheme()
                                .name("bearerAuth")
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}