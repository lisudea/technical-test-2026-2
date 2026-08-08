package com.lis.reservas;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * Application entry point for the LIS equipment reservation system.
 *
 * <p>Domain packages are organized by bounded context (equipo, reserva,
 * categoria, usuario, auth, estadisticas, common, config) rather than by
 * technical layer, so each domain owns its full vertical slice.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class ReservasApplication {

    public static void main(String[] args) {
        SpringApplication.run(ReservasApplication.class, args);
    }
}
