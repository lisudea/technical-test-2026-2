# Spec 02 — Backend (Spring Boot)

## Stack
- Java 21 LTS · Spring Boot 3.x · Maven
- Spring Web (REST) · Spring Security · Spring OAuth2 Client (Google) · Spring Data JPA · Hibernate Validator
- Flyway (migraciones, ver [04-database-spec.md](./04-database-spec.md))
- springdoc-openapi (Swagger UI autogenerado)
- JUnit 5 + Mockito + Testcontainers (MySQL real en tests de integración)

## Estructura de paquetes (por dominio)
```
com.lis.reservas
├── config/                # Seguridad, CORS, OpenAPI, beans
├── equipo/                # controller, service, repository, dto, entity, mapper
├── categoria/             # catálogo de categorías (Microcontroladores, VR, Redes, ...)
├── reserva/               # lógica de reserva y validación de conflicto
├── usuario/               # persistencia mínima de usuarios (nombre, correo)
├── auth/                  # Google SSO + emisión y validación de JWT
├── estadisticas/          # endpoint Top 5 (bonus)
├── common/                # excepciones, RFC 7807, paginación, utilidades
└── ReservasApplication.java
```
Organización **por dominio** (no por capa técnica global): cada módulo agrupa
`controller/service/repository/dto/entity` de su área. Facilita ubicar código y
refleja las tablas del esquema.

## Convenciones de API
- Prefijo de versión: `/api/v1/...`
- Recursos en plural, kebab-case: `/api/v1/equipos`, `/api/v1/reservas`
- Respuestas de error estandarizadas con **RFC 7807 (Problem Details)**:
  ```json
  { "type": "https://lis.udea.edu.co/errors/reserva-en-conflicto",
    "title": "Reserva en conflicto",
    "status": 409,
    "detail": "El equipo 42 ya está reservado entre 2026-08-10T14:00 y 2026-08-10T16:00" }
  ```
- Paginación con `page`, `size`, `sort` en listados (`Page<T>` de Spring Data);
  respuesta incluye `content`, `totalElements`, `totalPages`, `number`, `size`.
- Filtros por query params.
- Fechas y horas en formato **ISO-8601** con zona horaria (`OffsetDateTime`); la
  API asume `America/Bogota` (UTC-5) si el cliente omite el offset, pero siempre
  devuelve valores con offset explícito.

## Endpoints principales

### Equipos (obligatorio)
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/v1/equipos` | Lista paginada. Filtros: `?categoria=VR&estado=disponible&page=0&size=20&sort=nombre,asc` | Público (lectura) |
| `GET` | `/api/v1/equipos/{id}` | Detalle de un equipo | Público |
| `POST` | `/api/v1/equipos` | Crear equipo | JWT |
| `PUT` | `/api/v1/equipos/{id}` | Actualizar equipo completo | JWT |
| `PATCH` | `/api/v1/equipos/{id}/estado` | Cambiar solo el estado (`disponible`/`mantenimiento`/`baja`) | JWT |

Campos de un equipo: `id`, `nombre`, `numero_serie` (o `mac_address` según
categoría), `id_categoria`, `estado`, `descripcion`, `fecha_creacion`,
`fecha_actualizacion`. Ver [04-database-spec.md](./04-database-spec.md).

### Reservas (obligatorio)
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `POST` | `/api/v1/reservas` | Crear reserva. Body: `{ nombre_usuario, correo_usuario, id_equipo, fecha_hora_inicio, fecha_hora_fin }` | JWT (bonus) / abierto en base |
| `GET` | `/api/v1/reservas` | Listar reservas. Filtros: `?id_equipo=...&correo_usuario=...&desde=...&hasta=...&estado=activa` | JWT |
| `GET` | `/api/v1/reservas/{id}` | Detalle de una reserva | JWT |
| `DELETE` | `/api/v1/reservas/{id}` | Cancelar reserva (marca `estado='cancelada'`, no borra) | JWT |

**Regla de negocio crítica — validación de conflicto**:
al crear una reserva se debe rechazar con **HTTP 409 Conflict** si existe otra
reserva `activa` para el mismo `id_equipo` cuya franja `[inicio, fin)` se solape
con la solicitada. La comprobación se hace dentro de una transacción con
`SELECT ... FOR UPDATE` sobre las reservas del equipo para evitar la condición de
carrera entre validación e inserción (dos requests concurrentes que pasan la
validación al mismo tiempo). Además, la lógica valida:
- `fecha_hora_inicio < fecha_hora_fin`
- `fecha_hora_inicio` no puede estar en el pasado
- Duración máxima configurable (ej. 8 horas) para evitar reservas indefinidas
- El equipo debe estar en estado `disponible` (no `mantenimiento` ni `baja`)

Consulta de solape (dos franjas `[a1,a2)` y `[b1,b2)` se solapan si `a1 < b2 AND b1 < a2`):
```sql
SELECT id_reserva
FROM reservas
WHERE id_equipo = :idEquipo
  AND estado = 'activa'
  AND fecha_hora_inicio < :nuevaFin
  AND fecha_hora_fin > :nuevaInicio
FOR UPDATE;
```

### Estadísticas (bonus)
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/v1/estadisticas/equipos-top?limit=5` | Top N equipos más reservados históricamente (excluye canceladas). |

### Autenticación Google SSO (bonus)
| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/v1/auth/google` | Body: `{ id_token }` obtenido en el frontend con Google Identity Services. El backend valida la firma del token contra las llaves públicas de Google, verifica que `email_verified=true` y que el dominio del `email` sea `@udea.edu.co`. Crea/actualiza el usuario y emite un JWT propio. |
| `GET` | `/api/v1/auth/me` | Devuelve el perfil del usuario autenticado (nombre, correo). |

El detalle completo de request/response y códigos de error vive en el OpenAPI
generado (`/swagger-ui.html`), no se duplica aquí para evitar que spec y código
diverjan.

## Seguridad
- **Autenticación**: JWT propio (access token ~30 min) firmado con clave desde
  Secrets Manager. Se obtiene intercambiando un `id_token` de Google.
- **Validación de dominio institucional**: al recibir el `id_token`, se rechaza
  con `403` si el `email` no termina en `@udea.edu.co`.
- **Autorización**: los endpoints de creación/modificación (`POST /reservas`,
  `POST /equipos`, etc.) requieren JWT válido. Los `GET` de equipos son
  públicos para permitir que el dashboard cargue sin login previo.
- **CORS**: whitelist explícita del dominio de CloudFront, sin `*`.
- **Rate limiting** básico en `/auth/google` para mitigar abuso (bucket4j o
  filtro propio).
- **Sin passwords propios**: no se almacenan contraseñas — toda la
  autenticación delega en Google. Esto reduce superficie de ataque y evita
  administrar hashing, reset de password, etc.

## Manejo de errores
`@RestControllerAdvice` centralizado que traduce excepciones de dominio a
respuestas Problem Details consistentes, sin exponer stack traces al cliente:

| Excepción | HTTP | Cuándo |
|---|---|---|
| `ReservaEnConflictoException` | 409 | Franja solapada con otra reserva activa |
| `EquipoNoDisponibleException` | 409 | Equipo en mantenimiento o baja |
| `RecursoNoEncontradoException` | 404 | Equipo/reserva/categoría inexistente |
| `ValidacionException` | 400 | Fechas inválidas, duración fuera de rango |
| `DominioNoAutorizadoException` | 403 | Correo Google no es `@udea.edu.co` |
| `MethodArgumentNotValidException` | 400 | Validación de Bean Validation (`@NotBlank`, `@Email`, ...) |

## Testing
| Tipo | Herramienta | Qué cubre |
|---|---|---|
| Unitario | JUnit 5 + Mockito | Lógica de servicios: cálculo de solape, validación de dominio de correo, ordenamiento del top-5 |
| Integración | Testcontainers (MySQL 8) | Repositorios y flujo completo contra base real: crear reserva, intentar solape, cancelar, listar filtrado |
| Concurrencia | Test dedicado | Dos hilos crean reservas solapadas simultáneas: exactamente una debe ganar, la otra recibe 409 |
| Contrato de API | MockMvc | Códigos de estado, forma del Problem Details, paginación, filtros |

Umbral sugerido: cobertura de línea >70% en `service/`, con foco en el módulo
`reserva/` que concentra la lógica crítica.

## Contenedor
`Containerfile` (compatible Podman/Docker) multi-stage: build con Maven en una
etapa, runtime en `eclipse-temurin:21-jre-alpine` — imagen final liviana, sin JDK
ni código fuente. Detalle de build/push en [05-infra-devops.md](./05-infra-devops.md).
