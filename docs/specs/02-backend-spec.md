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
├── usuario/               # usuarios y su Rol (ESTUDIANTE / AUXILIAR / ADMIN)
├── auth/                  # Google SSO, JWT con claim de rol, CurrentUser
├── prestamo/              # mesa del auxiliar: entrega, devolución, no-show
├── sancion/               # sanciones con vigencia derivada de la fecha
├── admin/                 # usuarios, asignación de roles, resumen operativo
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
| `POST` | `/api/v1/equipos` | Crear equipo | **ADMIN** |
| `PUT` | `/api/v1/equipos/{id}` | Actualizar equipo completo | **ADMIN** |
| `PATCH` | `/api/v1/equipos/{id}/estado` | Cambiar solo el estado (`disponible`/`mantenimiento`/`baja`) | **AUXILIAR / ADMIN** |

El cambio de estado es deliberadamente más abierto que el CRUD completo: un
auxiliar manda un equipo a mantenimiento desde el mostrador, y no debería
necesitar permisos de catálogo para hacerlo.

### Mesa de préstamos (`/api/v1/prestamos`) — AUXILIAR / ADMIN
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/agenda` | Cola del día; incluye equipos entregados en días previos aún sin devolver |
| `GET` | `/resumen` | Contadores del día, incluidos los vencidos |
| `POST` | `/{idReserva}/entrega` | `PENDIENTE` → `ENTREGADO` |
| `POST` | `/{idReserva}/devolucion` | `ENTREGADO` → `DEVUELTO`; la reserva pasa a `COMPLETADA` |
| `POST` | `/{idReserva}/no-reclamado` | `PENDIENTE` → `NO_RECLAMADO`; cancela la reserva y libera la franja |

Las transiciones ilegales se rechazan con `400` nombrando el estado que
bloqueó la acción. Ver [ADR 0006](../adr/0006-prestamo-en-columna-aparte-de-la-reserva.md).

### Sanciones (`/api/v1/sanciones`)
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `POST` | `/` | Crear sanción de N días | **ADMIN** |
| `GET` | `/` | Listado con filtros (`estado`, `soloVigentes`) | **AUXILIAR / ADMIN** |
| `GET` | `/mias` | Sanciones propias | Cualquier autenticado |
| `PATCH` | `/{id}/levantar` | Levantar antes de tiempo, con justificación | **ADMIN** |

Ver [ADR 0007](../adr/0007-sanciones-como-filas-con-vigencia-derivada.md).

### Administración (`/api/v1/admin`) — ADMIN
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/usuarios` | Listado paginado con filtros `rol` y `buscar` |
| `PATCH` | `/usuarios/{id}/rol` | Asignar rol |
| `GET` | `/resumen` | Catálogo, reservas, préstamos, sanciones y personas |

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
- **Autorización por rol**: tres niveles ordenados, `ESTUDIANTE` <
  `AUXILIAR` < `ADMIN`. El rol viaja como claim del JWT y el filtro lo
  traduce a `GrantedAuthority`. Los `GET` de equipos siguen siendo públicos
  para que el dashboard cargue sin login. Ver
  [ADR 0005](../adr/0005-roles-en-el-jwt-y-401-vs-403.md).
- **Reglas de fila, no de ruta**: «un estudiante solo ve lo suyo» no se puede
  expresar con un patrón de URL, así que vive en la capa de servicio, que es
  la única que puede comparar el principal contra la propiedad de la fila. Un
  recurso ajeno responde `404`, no `403`: un `403` confirmaría que el id
  existe.
- **`401` y `403` no son intercambiables**: `401` es «no sé quién eres»,
  `403` es «sé quién eres y no puedes». Requiere `authenticationEntryPoint`
  **y** `accessDeniedHandler` explícitos, más `DispatcherType.ERROR`
  permitido; si no, el reenvío interno a `/error` reescribe el `403` como
  `401`.
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
