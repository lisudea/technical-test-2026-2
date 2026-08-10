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
| Autenticación admin | JWT propio, login por correo/contraseña (BCrypt) |
| Verificación de identidad institucional | Google Sign-In (OAuth2 / OpenID Connect), restringido a `@udea.edu.co` |

---

## Modelo de datos

El diseño completo del modelo entidad-relación se pensó antes de escribir código, partiendo de los requerimientos obligatorios del reto.

![Diagrama Entidad-Relación](docs/er-diagram.png)

**Entidades principales:**

- **Equipo** — inventario de hardware del laboratorio (nombre, identificador único, categoría, estado físico).
- **Categoria** — entidad independiente (no un enum fijo), para permitir que un administrador registre nuevas categorías sin recompilar el sistema.
- **Reserva** — franjas de tiempo reservadas por una persona con correo institucional verificado, sobre un equipo específico. El `usuarioCorreo` nunca lo envía el cliente como texto libre: se extrae del `id_token` de Google, verificado server-side.
- **Usuario** — exclusivamente para administración/autenticación con password (rol `ADMIN`). No tiene relación con `Reserva`.

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
└── security/          # JWT, GoogleTokenVerifierService, SecurityConfig
```

---

## Configuración y arranque

### 1. Clonar el repositorio

```powershell
git clone https://github.com/lisudea/technical-test-2026-2.git
cd technical-test-2026-2
git checkout 1032179304-reto2
cd gestion-reservas-equipos
```

> ⚠️ El proyecto Maven (código fuente, `pom.xml`, `mvnw`) vive dentro de la carpeta `gestion-reservas-equipos/`, no en la raíz del repositorio — la raíz solo contiene este README, la carpeta `docs/` (diagrama ER), y el proyecto en sí. Todos los comandos de este documento (configuración, arranque) se ejecutan **desde dentro de esa carpeta**, no desde la raíz del repo.

### 2. Configurar la base de datos y credenciales

```properties
spring.application.name=gestion-reservas-equipos
spring.config.import=optional:classpath:application-local.properties
```

Crea `application-local.properties` en `src/main/resources`:

```properties
spring.datasource.url=jdbc:postgresql://<host>:<puerto>/postgres
spring.datasource.username=postgres.<tu-project-ref>
spring.datasource.password=<tu-password>
spring.datasource.driver-class-name=org.postgresql.Driver

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

application.jwt.secret=<tu-secret-base64-de-al-menos-256-bits>
application.jwt.expiration=86400000

application.google.client-id=<tu-client-id-de-google-cloud-console>
```

> No incluyas `spring.jpa.properties.hibernate.dialect` — Hibernate 7 infiere el dialecto automáticamente a partir del driver.

**No subas este archivo al repositorio** — ya está excluido vía `.gitignore`.

> **¿Necesitas conectarte a mi base de datos real o probar con el Client ID de Google usado en desarrollo?** Contáctame en **miguemej07@gmail.com** o **m.mejia1@udea.edu.co**.

### 3. Ejecutar el proyecto

```powershell
./mvnw spring-boot:run
```

API en `http://localhost:8080`. Swagger UI en `http://localhost:8080/swagger-ui.html`.

### 4. Frontend

El [frontend de este sistema](https://github.com/lisudea/technical-test-2026-2/tree/1032179304-reto3) (Reto 3) consume esta API, espera encontrarla en `http://localhost:8080`, y requiere su propio Client ID de Google configurado (`VITE_GOOGLE_CLIENT_ID`) — debe ser el mismo proyecto de Google Cloud Console que este backend, ya que ambos validan contra la misma `audience`.

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
| POST | `/api/reservas` | Crear reserva. Body incluye `googleIdToken` en vez de correo — se verifica y se extrae el correo institucional antes de cualquier otra validación | Público, requiere `id_token` de Google válido (`@udea.edu.co`) |
| DELETE | `/api/reservas/{id}` | Cancelar reserva (soft-delete). El `id_token` de Google viaja en el header `X-Google-Id-Token` (no en query param, para no exponerlo en logs/historial de URLs); se rechaza si el correo verificado no coincide con el de la reserva | Público, requiere `id_token` de Google válido |
| DELETE | `/api/reservas/admin/{id}` | Eliminar reserva definitivamente, sin restricción de estado | 🔒 ADMIN |
| GET | `/api/reservas` | Listado paginado + filtros (`equipoId`, `estadoReserva`) — nunca expone `usuarioCorreo` | Público |

### Autenticación
| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| POST | `/api/auth/login` | Login admin (correo/contraseña), retorna JWT | Público |
| POST | `/api/auth/login/google` | Login admin vía Google (alternativa disponible, no usada en el flujo principal actual del frontend) | Público, requiere `id_token` de Google válido |

### Estadísticas
| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| GET | `/api/estadisticas/top-equipos` | Top 5 equipos más reservados históricamente, filtro opcional `desde`/`hasta` | Público |

**🌟 Bonus:** ambos ítems del enunciado (Top 5 y Google SSO) están implementados. Ver [`API_REFERENCE.md`](./docs/API_REFERENCE.md) para el contrato completo con ejemplos de request/response.

---

## Seguridad y roles

- **JWT propio**, generado tras validar credenciales de administrador contra la tabla `Usuario` (por password o, alternativamente, vía Google).
- **`@PreAuthorize("hasRole('ADMIN')")`** en mutaciones de inventario y en la eliminación administrativa de reservas.
- **Verificación de identidad institucional independiente del JWT de admin**: crear o cancelar una reserva no requiere sesión de administrador, pero sí un `id_token` de Google válido, verificado server-side (firma, audiencia, y dominio `@udea.edu.co`) en cada una de esas dos operaciones — no se emite ni se reutiliza un token propio para esto, cada request se verifica de forma independiente contra Google.
- El correo de quien reserva (`usuarioCorreo`) nunca se expone en ningún endpoint de lectura, y ya no se recibe como texto libre del cliente en ningún endpoint — siempre se deriva de un `id_token` verificado.
- El primer usuario `ADMIN` se inserta manualmente en la base de datos; no existe endpoint público de auto-registro como administrador.

---

## Reglas de negocio

- **Verificación de identidad institucional:** tanto crear como cancelar una reserva requieren un `id_token` de Google válido, con correo `@udea.edu.co` — se verifica antes que cualquier otra regla de negocio. Token inválido, expirado, mal formado, o de dominio distinto → `401 Unauthorized` (`InvalidGoogleTokenException`).
- **Validación de solape de reservas:** rechaza con `409 Conflict` si el equipo ya tiene otra reserva `ACTIVA` cuyo rango de tiempo se cruza con el solicitado.
- **Disponibilidad del equipo:** solo se puede reservar un equipo cuyo `estadoFisico` sea `DISPONIBLE` (`409 Conflict` si está en `MANTENIMIENTO` o `DE_BAJA`).
- **Validación de rango de fechas:** `fechaHoraFin` debe ser estrictamente posterior a `fechaHoraInicio` (`400 Bad Request` si no).
- **Cancelación pública como soft-delete:** requiere un `id_token` válido cuyo correo coincida con el de la reserva (`403 Forbidden` si no coincide, distinto del `401` de token inválido); una reserva ya `CANCELADA` no puede volver a cancelarse (`409 Conflict`).
- **Eliminación administrativa de reservas:** borrado físico y permanente, sin restricciones de estado, exclusivo de `ADMIN`.
- **Integridad de Equipo:** no se puede cambiar `estadoFisico` ni eliminar un equipo con reservas `ACTIVAS` asociadas. Un equipo con historial de reservas `CANCELADAS` (sin activas) tampoco se elimina físicamente — se sugiere usar `DE_BAJA`.
- **Integridad de Categoria:** no se puede eliminar una categoría con equipos asociados.
- **Disponibilidad derivada:** un equipo no tiene un campo de "disponible/reservado" — se calcula consultando si existe una reserva activa que se solape con el momento consultado (calculado en el frontend, cruzando equipos y reservas activas).

---

## Decisiones de diseño

- **`Categoria` es una entidad, no un enum**, para permitir que un administrador registre nuevas sin recompilar el sistema.
- **`Usuario` no se relaciona con `Reserva`** — la identidad de quien reserva se verifica con Google en cada operación, no requiere una cuenta persistida en el sistema.
- **`estadoFisico` no representa disponibilidad en tiempo real** — solo condiciones físicas del equipo; la ocupación puntual se deriva de las reservas activas.
- **IDs con `IDENTITY`**, no `UUID` — no hay requisito de no-secuencialidad en este alcance.
- **Filtros con `Specification`** en Equipo y Reserva, para evitar explosión combinatoria de métodos de repositorio.
- **De "confirmar correo" a verificación real con Google:** la primera versión de la protección de reservas pedía reingresar el correo como confirmación manual — suficiente para evitar cancelaciones accidentales, pero no impedía que alguien mintiera sobre su identidad al *crear* una reserva. El enunciado pide explícitamente un token que *"proteja la creación de reservas"* validando dominio institucional; la solución final reemplaza el correo de texto libre por la verificación server-side del `id_token` de Google en creación y cancelación, sin depender de que el cliente reporte honestamente su propio correo.
- **`id_token` en cancelación vía header, no query param:** evita que el token quede expuesto en logs de acceso, historial del navegador, o cachés de proxy, que sí ocurriría si viajara en la URL.
- **Eliminación administrativa de reservas separada de la cancelación pública:** son operaciones con autorización y semántica distintas (verificación de identidad institucional vs. rol `ADMIN` con borrado físico), por lo que viven en rutas y métodos de servicio independientes.
- **Login de admin vía Google disponible pero no exclusivo:** se construyó `POST /api/auth/login/google` reutilizando `GoogleTokenVerifierService`, pero el admin actual sigue usando password como método principal — la opción queda lista para uso futuro sin trabajo adicional.
