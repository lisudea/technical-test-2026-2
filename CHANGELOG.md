# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/)
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).
Los tags de entrega siguen el patrón `vMAJOR.MINOR.PATCH-retoN` (ver
[ADR 0004](docs/adr/0004-una-rama-por-reto-sin-merge-a-main.md)).

## [0.2.0-reto2] — 2026-08-09

Entrega del **Reto 2 (Backend)**: API REST completa para la gestión y reserva
de equipos del LIS, con validación de conflictos a nivel de aplicación y
autenticación delegada en Google SSO (bonus).

### Added

- **Esquema de base de datos** (Flyway `V1__`…`V5__`):
  - Tablas `categorias`, `equipos`, `usuarios`, `reservas` y `log_actividad`.
  - Índice compuesto `idx_reservas_conflicto (id_equipo, estado, fecha_hora_inicio, fecha_hora_fin)` que optimiza la consulta de solape.
  - View `estadisticas_equipos_top` que alimenta el endpoint de Top N (excluye reservas canceladas).
  - Datos semilla: 4 categorías, 10 equipos, 3 usuarios `@udea.edu.co` y 5 reservas (pasadas, futuras y una cancelada).
- **API de equipos** (`/api/v1/equipos`):
  - `GET` listado paginado con filtros por `categoria`, `estado` y `nombre` (público).
  - `GET /{id}` detalle (público, 404 si no existe).
  - `POST` creación con validación Bean Validation (JWT, 201 + `Location`).
  - `PUT /{id}` actualización completa (JWT).
  - `PATCH /{id}/estado` cambio de estado `disponible`/`mantenimiento`/`baja` (JWT).
- **API de categorías** (`/api/v1/categorias`): listado, detalle y creación.
- **API de reservas** (`/api/v1/reservas`):
  - `POST` creación con validación de franja (`inicio < fin`, no en pasado, duración entre 15 min y 8 h configurable, equipo `disponible`) y **validación de solape con `SELECT ... FOR UPDATE` dentro de transacción** → 409 `ReservaEnConflictoException` si hay conflicto.
  - `GET` listado paginado con filtros `idEquipo`, `correoUsuario`, `desde`, `hasta`, `estado` (JWT).
  - `GET /{id}` detalle (JWT).
  - `DELETE /{id}` cancelación como soft delete (marca `estado='cancelada'`, conserva la fila para auditoría y estadísticas).
- **API de estadísticas** (`/api/v1/estadisticas/equipos-top?limit=5`, bonus): Top N equipos más reservados históricamente (público, `limit` acotado a 50).
- **Autenticación Google SSO** (`/api/v1/auth`, bonus):
  - `POST /google` valida el `id_token` contra las llaves públicas de Google, exige `email_verified=true` y dominio `@udea.edu.co` (403 si no), hace upsert del usuario por correo y emite un JWT propio.
  - `GET /me` devuelve el perfil del usuario autenticado.
  - `JwtAuthenticationFilter` + `SecurityConfig` stateless: los `GET` públicos (equipos, categorías, estadísticas) y `POST /auth/google` quedan abiertos; el resto requiere JWT. 401 con RFC 7807 Problem Details si falta.
- **Manejo de errores centralizado** (`@RestControllerAdvice` → RFC 7807 Problem Details):
  - `ReservaEnConflictoException` → 409, `EquipoNoDisponibleException` → 409, `RecursoNoEncontradoException` → 404, `ValidacionException` → 400, `DominioNoAutorizadoException` → 403, `MethodArgumentNotValidException` → 400.
- **Documentación OpenAPI** con springdoc-openapi: Swagger UI en `/swagger-ui.html` anotado en los endpoints críticos (`@Operation`, `@ApiResponse`, `@Schema`).
- **Tests**: unitarios con JUnit 5 + Mockito para la lógica de servicios, incluyendo **test de concurrencia** que lanza dos reservas simultáneas sobre la misma franja y verifica que exactamente una gana y la otra recibe 409. Tests de integración con Testcontainers (MySQL 8 real) para repositorios y flujos completos.
- **Infraestructura como código**: Containerfile multi-stage (build Maven + runtime `eclipse-temurin:21-jre-alpine`), `infra/compose.yaml` para desarrollo local con Podman/Docker, módulos de Terraform para ECS Fargate + ALB + RDS MySQL, y workflows de GitHub Actions (CI sobre la rama del reto, build de imagen, despliegue manual).
- **Documentación**:
  - ADRs 0001–0004 (ECS Fargate, validación de solape en app, Google SSO, estrategia de branching) en `docs/adr/`.
  - Colección de Postman v2.1 en `docs/postman/reservas-lis.postman_collection.json` con todos los endpoints, casos de conflicto y bonus.
  - README raíz con instrucciones de levantamiento, pruebas con `curl` y credenciales semilla.
  - CHANGELOG (este archivo).

### Security

- Configuración Spring Security stateless (CSRF deshabilitado, sesiones `STATELESS`).
- `JWT_SECRET` y `GOOGLE_CLIENT_SECRET` se leen de variables de entorno / Secrets Manager; nunca se commitean.
- CORS configurable vía `CORS_ALLOWED_ORIGINS` (default `*` en dev, dominio CloudFront en prod).

### Notas

- `ddl-auto: validate`: Flyway es el único dueño del esquema; Hibernate solo valida que el mapeo coincida.
- `open-in-view: false`: sin OSIV, para forzar que las consultas se resuelvan dentro de la transacción del servicio.
- Zona horaria por defecto `America/Bogota` (UTC-5) en Jackson e Hibernate; las fechas se devuelven con offset explícito.

[0.2.0-reto2]: https://github.com/lis-udea/technical-test-2026-2/releases/tag/v0.2.0-reto2
