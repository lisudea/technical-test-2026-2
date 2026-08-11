package equipment_api.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Metadatos de la documentacion interactiva.
 *
 *   Swagger UI -> http://localhost:8080/swagger-ui.html
 *   OpenAPI    -> http://localhost:8080/v3/api-docs
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI equipmentApiOpenAPI() {

        return new OpenAPI()
                .info(new Info()
                        .title("Equipment API - Gestion y Reservas de Equipos del LIS")
                        .version("1.0.0")
                        .description("""
                                API REST para gestionar el inventario de hardware del Laboratorio
                                Integrado de Sistemas (Universidad de Antioquia) y sus reservas.

                                ## Regla de negocio critica

                                Un equipo no puede estar reservado por dos usuarios en la misma
                                franja horaria. Dos reservas se solapan si y solo si
                                `A.inicio < B.fin` y `A.fin > B.inicio`; se tratan como intervalos
                                semiabiertos, de modo que dos reservas contiguas NO son conflicto:

                                - `10:00-11:00` y `11:00-12:00` -> 201 Created (se tocan)
                                - `10:00-11:00` y `10:30-11:30` -> **409 Conflict** (se cruzan)

                                ## Otras reglas de negocio

                                Al crear una reserva se comprueba, en este orden: que el inicio sea
                                anterior al fin, que no supere la duracion maxima (8 h por defecto),
                                que el equipo exista, que **no este en mantenimiento**, que se sepa
                                quien reserva, y por ultimo el solapamiento. Cada situacion devuelve
                                un `code` propio en el cuerpo del error.

                                ## Autenticacion y permisos

                                Las consultas (GET) son siempre publicas.

                                - **Reservar y cancelar**: publico por defecto. Basta con enviar
                                  `userName` y `userEmail` en el cuerpo. Con
                                  `app.security.protect-reservations=true` pasa a exigir JWT, que es
                                  el modo descrito por el bonus del enunciado.
                                - **Gestionar el inventario** (POST y PUT de equipos): **exige sesion**
                                  por defecto (`app.security.protect-equipment=true`). Administrar el
                                  catalogo es una accion de gestion, no de uso.

                                Si se envia un JWT valido, la identidad se toma SIEMPRE del token y
                                se ignoran los campos del cuerpo, de modo que nadie pueda reservar
                                en nombre de otra persona.

                                Para obtener un token: abrir `/oauth2/authorization/google` en el
                                navegador. Solo se aceptan cuentas `@udea.edu.co`.
                                """)
                        .contact(new Contact().name("Laboratorio Integrado de Sistemas - UdeA"))
                        .license(new License().name("Uso academico")))

                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Entorno local")
                ))

                .components(new Components()
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Token JWT obtenido tras el login con Google. "
                                        + "Pegar aqui solo el token, sin el prefijo 'Bearer '.")));
    }
}