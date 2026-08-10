# Prueba Técnica LIS 2026-2 — Reto 2: Backend
## Sistema de Gestión y Reservas de Equipos

**Miguel Mejía**

Estudiante de Ingeniería de Sistemas

Universidad de Antioquia

## Tabla de contenido

- [Stack tecnológico](#stack-tecnológico)
- [Modelo de datos](#modelo-de-datos)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Configuración y arranque](#configuración-y-arranque)
- [Endpoints](#endpoints)
- [Seguridad y roles](#seguridad-y-roles)
- [Reglas de negocio](#reglas-de-negocio)
- [Decisiones de diseño](#decisiones-de-diseño)

---

## Stack tecnológico

| Componente | Tecnología |
|---|---|
| Lenguaje | Java 21 |
| Framework | Spring Boot 4.1.0 |
| Persistencia | Spring Data JPA |
| Base de datos | PostgreSQL (hospedado en [Supabase](https://supabase.com)) |
| Utilidades | Lombok |
| Documentación de API | springdoc-openapi (Swagger UI) |
| Autenticación | JWT propio, login por correo/contraseña (BCrypt). Diseñado para migrar a Google SSO como mejora posterior sin tocar la infraestructura de JWT. |

---

## Modelo de datos

El diseño completo del modelo entidad-relación se pensó antes de escribir código, partiendo de los requerimientos obligatorios del reto.

![Diagrama Entidad-Relación](docs/er-diagram.png)

**Entidades principales:**

- **Equipo** — inventario de hardware del laboratorio (nombre, identificador único, categoría, estado físico).
- **Categoria** — entidad independiente (no un enum fijo), para permitir que un administrador registre nuevas categorías sin recompilar el sistema.
- **Reserva** — franjas de tiempo reservadas por un usuario (identificado solo por nombre y correo) sobre un equipo específico.
- **Usuario** — exclusivamente para administración/autenticación (rol `ADMIN`). No tiene relación con `Reserva`.

---

## Estructura del proyecto

```
co.edu.lab.sistemas
├── model/            # Entidades JPA (Equipo, Categoria, Reserva, Usuario)
├── enums/            # Enums de dominio (EstadoFisico, EstadoReserva, Rol)
├── repository/        # Interfaces JpaRepository (+ JpaSpecificationExecutor)
├── service/           # Lógica de negocio y reglas de validación
├── controller/         # Endpoints REST
├── dto/                # Objetos de request/response (records)
├── exception/          # Manejo global de errores y excepciones custom
└── security/          # JWT (JwtUtil, JwtAuthenticationFilter), SecurityConfig
```

---

## Configuración y arranque

### 1. Clonar el repositorio

```powershell
git clone https://github.com/lisudea/technical-test-2026-2.git
cd technical-test-2026-2
git checkout 1032179304-reto2
```

### 2. Configurar la base de datos local

El proyecto usa PostgreSQL alojado en Supabase. El `application.properties` principal ya está preparado para delegar la configuración sensible a un archivo separado no versionado:

```properties
spring.application.name=gestion-reservas-equipos
spring.config.import=optional:classpath:application-local.properties
```

Para configurarlo:

1. Crea un archivo `application-local.properties` dentro de `src/main/resources` con el siguiente contenido:
```properties
spring.datasource.url=jdbc:postgresql://<host>:<puerto>/postgres
spring.datasource.username=postgres.<tu-project-ref>
spring.datasource.password=<tu-password>
spring.datasource.driver-class-name=org.postgresql.Driver

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

application.jwt.secret=<tu-secret-base64-de-al-menos-256-bits>
application.jwt.expiration=86400000
```

> No incluyas `spring.jpa.properties.hibernate.dialect` — Hibernate 7 infiere el dialecto automáticamente a partir del driver.

2. Completa los valores de conexión (`<host>`, `<puerto>`, `<tu-project-ref>`, `<tu-password>`) con tus propias credenciales de Supabase.
3. **No subas este archivo al repositorio** — ya está excluido vía `.gitignore`.

> **¿Necesitas conectarte a mi base de datos real?** Las credenciales de conexión son personales y no están expuestas en este repositorio por seguridad. Contáctame directamente en **miguemej07@gmail.com** o **m.mejia1@udea.edu.co** y te las comparto.

### 3. Ejecutar el proyecto

```powershell
./mvnw spring-boot:run
```

La API debería quedar disponible en `http://localhost:8080`. La documentación interactiva (Swagger UI) queda en `http://localhost:8080/swagger-ui.html`.

### 4. Frontend

El [frontend de este sistema](https://github.com/lisudea/technical-test-2026-2/tree/1032179304-reto3) (Reto 3) consume esta API y espera encontrarla en `http://localhost:8080`.

---

## Endpoints

### Equipos
| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| POST | `/api/equipos` | Registrar equipo | 🔒 ADMIN |
| PUT | `/api/equipos/{id}` | Actualizar equipo (bloqueado si tiene reservas ACTIVAS y se cambia el estado físico) | 🔒 ADMIN |
| DELETE | `/api/equipos/{id}` | Eliminar equipo (bloqueado si tiene cualquier reserva asociada) | 🔒 ADMIN |
| GET | `/api/equipos/{id}` | Consultar equipo por id | Público |
| GET | `/api/equipos` | Listado paginado + filtros (`categoriaId`, `estadoFisico`) | Público |

### Categorías
| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| POST | `/api/categorias` | Crear categoría | 🔒 ADMIN |
| PUT | `/api/categorias/{id}` | Actualizar categoría | 🔒 ADMIN |
| DELETE | `/api/categorias/{id}` | Eliminar categoría (bloqueado si tiene equipos asociados) | 🔒 ADMIN |
| GET | `/api/categorias` | Listar categorías | Público |

### Reservas
| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| POST | `/api/reservas` | Crear reserva (valida solape, disponibilidad y rango de fechas) | Público |
| DELETE | `/api/reservas/{id}?correo=` | Cancelar reserva (soft-delete; requiere confirmar el correo con el que se reservó) | Público |
| DELETE | `/api/reservas/admin/{id}` | Eliminar reserva definitivamente, sin restricción de estado | 🔒 ADMIN |
| GET | `/api/reservas` | Listado paginado + filtros (`equipoId`, `estadoReserva`) — nunca expone `usuarioCorreo` | Público |

> ℹ️ Los datos de acceso para correo y contraseña del admin de prueba ahora mismo son `admin@udea.edu.co` y `admin123` respectivamente.

### Autenticación
| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| POST | `/api/auth/login` | Login (correo/contraseña), retorna JWT | Público |

### Estadísticas
| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| GET | `/api/estadisticas/top-equipos` | Top 5 equipos más reservados históricamente, filtro opcional `desde`/`hasta` | Público |

### Bonus
| Función | Estado |
|---|---|
| Google SSO (reemplazo del login simple, validando dominio `@udea.edu.co`) | 🔲 Pendiente |

---

## Seguridad y roles

- Autenticación basada en **JWT propio** (no de terceros), generado tras validar credenciales contra la tabla `Usuario`.
- Autorización mediante **`@PreAuthorize("hasRole('ADMIN')")`** a nivel de método, en mutaciones de inventario (equipos, categorías) y en la eliminación administrativa de reservas.
- Regla de acceso: **toda lectura del catálogo es pública, toda mutación del catálogo requiere rol `ADMIN`, y reservar/cancelar (con confirmación de correo) es posible sin cuenta**, según el enunciado.
- El correo de quien reserva (`usuarioCorreo`) nunca se expone en ningún endpoint de lectura — solo se usa internamente para validar la cancelación pública.
- El primer usuario `ADMIN` se inserta manualmente en la base de datos (no existe endpoint público de auto-registro como administrador, por diseño).

---

## Reglas de negocio

- **Validación de solape de reservas:** rechaza con `409 Conflict` si el equipo ya tiene otra reserva `ACTIVA` cuyo rango de tiempo se cruza con el solicitado.
- **Disponibilidad del equipo:** solo se puede reservar un equipo cuyo `estadoFisico` sea `DISPONIBLE` (`409 Conflict` si está en `MANTENIMIENTO` o `DE_BAJA`).
- **Validación de rango de fechas:** `fechaHoraFin` debe ser estrictamente posterior a `fechaHoraInicio` (`400 Bad Request` si no).
- **Cancelación pública como soft-delete:** requiere reconfirmar el correo de quien reservó (`403 Forbidden` si no coincide); una reserva ya `CANCELADA` no puede volver a cancelarse (`409 Conflict`).
- **Eliminación administrativa de reservas:** borrado físico y permanente, sin restricciones de estado, exclusivo de `ADMIN`, sin necesidad de confirmar correo.
- **Integridad de Equipo:** no se puede cambiar `estadoFisico` ni eliminar un equipo con reservas `ACTIVAS` asociadas (`409 Conflict`). Un equipo con historial de reservas `CANCELADAS` (sin activas) tampoco se elimina físicamente — se sugiere usar `DE_BAJA`.
- **Integridad de Categoria:** no se puede eliminar una categoría con equipos asociados.
- **Disponibilidad derivada:** un equipo no tiene un campo de "disponible/reservado" — se calcula consultando si existe una reserva activa que se solape con el momento consultado.

---

## Decisiones de diseño

- **`Categoria` es una entidad, no un enum:** el enunciado da ejemplos de categorías ("Microcontroladores, VR, Redes") sin cerrarlas a una lista fija, así que se modeló como tabla independiente para que un administrador pueda registrar nuevas sin recompilar el sistema.
- **`Usuario` no se relaciona con `Reserva`:** el enunciado especifica que quien reserva se identifica solo por nombre y correo, sin necesidad de cuenta. `Usuario` existe únicamente para la capa de administración/autenticación, manteniendo ambos conceptos desacoplados a propósito.
- **`estadoFisico` en `Equipo` no representa disponibilidad:** solo cubre condiciones físicas del equipo (`DISPONIBLE`, `MANTENIMIENTO`, `DE_BAJA`). Si el equipo está prestado en un momento específico es algo que se infiere de las reservas activas, no un campo propio.
- **IDs autogenerados con `IDENTITY`:** se usa `Long` en vez de `UUID`, ya que no hay requisito de no-secuencialidad para este alcance.
- **Filtros con `Specification`:** tanto Equipos como Reservas permiten filtros opcionales y combinables, evitando explotar combinatoriamente los métodos del repositorio.
- **Login simple como base desacoplada para Google SSO:** la verificación de identidad (`AuthService`) está separada de la generación del token (`JwtUtil`), para poder sustituir solo la primera por Google SSO sin reescribir el resto del módulo de seguridad.
- **Eliminación administrativa de reservas separada de la cancelación pública:** son operaciones con autorización y semántica distintas (soft-delete con verificación de correo vs. borrado físico autorizado por rol), por lo que viven en rutas y métodos de servicio independientes en vez de una variante condicional del mismo endpoint.
