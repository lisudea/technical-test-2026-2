# API Reference - Gestion Reservas Equipos

This document describes the real backend surface exposed by the current Spring Boot application. It is organized by module in the same order as the controllers: Autenticacion, Equipos, Categorias, Reservas and Estadisticas.

Scope note: `ReservaController` currently exposes an additional admin-only hard-delete endpoint (`DELETE /api/reservas/admin/{id}`) besides the public cancel flow. It is documented here because it exists in the current codebase.

## Common response formats

### Successful responses
- JSON bodies are returned for all endpoints except admin hard-delete endpoints that return `204 No Content`.
- Pagination endpoints return Spring Data `Page<T>` serialization with `content` plus pagination metadata.

### Error responses
The global exception handler returns these shapes:
- Generic business / HTTP errors: `{ "timestamp": "...", "status": 409, "error": "Conflict", "message": "..." }`
- Validation errors: `{ "timestamp": "...", "status": 400, "error": "Bad Request", "errores": { "field": "message" } }`

## 1. Autenticacion

### POST /api/auth/login
- Auth: Public
- JWT: Not required

#### Request body
```json
{
  "correo": "string (required, email)",
  "password": "string (required, not blank)"
}
```

Fields:
- `correo` (`String`): required, must be a valid email.
- `password` (`String`): required, cannot be blank.

#### Successful response
- Status: `200 OK`
- Body:
```json
{
  "token": "string",
  "correo": "string",
  "rol": "string"
}
```

Field details:
- `token` (`String`): JWT signed token.
- `correo` (`String`): authenticated user email.
- `rol` (`String`): enum name, currently `ADMIN`.

#### Errors
- `400 Bad Request`: validation failure in `correo` or `password`.
- `401 Unauthorized`: credentials are invalid. This happens when the email does not exist or the password does not match.
- `500 Internal Server Error`: unexpected runtime failure.

#### Example request
```http
POST /api/auth/login
Content-Type: application/json

{
  "correo": "admin@udea.edu.co",
  "password": "admin12"
}
```

#### Example success response
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "correo": "admin@udea.edu.co",
  "rol": "ADMIN"
}
```

#### Example error response
```json
{
  "timestamp": "2026-08-09T16:10:00.000",
  "status": 401,
  "error": "Unauthorized",
  "message": "Credenciales invalidas"
}
```

## 2. Equipos

### POST /api/equipos
- Auth: JWT required
- Role: `ADMIN`

#### Request body
```json
{
  "nombre": "string (required, not blank)",
  "identificador": "string (required, not blank)",
  "categoriaId": 1,
  "estadoFisico": "DISPONIBLE | MANTENIMIENTO | DE_BAJA"
}
```

#### Successful response
- Status: `201 Created`
- Body:
```json
{
  "id": 1,
  "nombre": "Microscopio Olympus",
  "identificador": "SN-001",
  "categoria": {
    "id": 2,
    "nombre": "Optica"
  },
  "estadoFisico": "DISPONIBLE",
  "fechaRegistro": "2026-08-09T10:15:30",
  "fechaActualizacion": "2026-08-09T10:15:30"
}
```

#### Errors
- `400 Bad Request`: validation failure in request body.
- `403 Forbidden`: missing/invalid token, expired token, or user without `ADMIN` role.
- `404 Not Found`: when the referenced category does not exist.
- `409 Conflict`: identifier already exists.
- `500 Internal Server Error`: unexpected failure.

#### Example request
```http
POST /api/equipos
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "nombre": "Microscopio Olympus",
  "identificador": "SN-001",
  "categoriaId": 2,
  "estadoFisico": "DISPONIBLE"
}
```

#### Example success response
```json
{
  "id": 1,
  "nombre": "Microscopio Olympus",
  "identificador": "SN-001",
  "categoria": {
    "id": 2,
    "nombre": "Optica"
  },
  "estadoFisico": "DISPONIBLE",
  "fechaRegistro": "2026-08-09T10:15:30",
  "fechaActualizacion": "2026-08-09T10:15:30"
}
```

#### Example error response
```json
{
  "timestamp": "2026-08-09T16:13:00.000",
  "status": 409,
  "error": "Conflict",
  "message": "Ya existe un equipo con el identificador SN-001"
}
```

### PUT /api/equipos/{id}
- Auth: JWT required
- Role: `ADMIN`

#### Path variables
- `id` (`Long`): required.

#### Request body
Same shape as `POST /api/equipos`.

#### Successful response
- Status: `200 OK`
- Body: same shape as `EquipoResponseDTO`.

#### Errors
- `400 Bad Request`: validation failure in request body.
- `403 Forbidden`: missing/invalid token, expired token, or user without `ADMIN` role.
- `404 Not Found`: equipment does not exist, or referenced category does not exist.
- `409 Conflict`: identifier already exists in another equipment. Also, if the request tries to change `estadoFisico` and the equipment has active reservations, the service rejects the update with a conflict message.
- `500 Internal Server Error`: unexpected failure.

#### Example request
```http
PUT /api/equipos/1
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "nombre": "Microscopio Olympus - actualizado",
  "identificador": "SN-001",
  "categoriaId": 2,
  "estadoFisico": "MANTENIMIENTO"
}
```

#### Example success response
```json
{
  "id": 1,
  "nombre": "Microscopio Olympus - actualizado",
  "identificador": "SN-001",
  "categoria": {
    "id": 2,
    "nombre": "Optica"
  },
  "estadoFisico": "MANTENIMIENTO",
  "fechaRegistro": "2026-08-09T10:15:30",
  "fechaActualizacion": "2026-08-09T10:20:10"
}
```

#### Example error response
```json
{
  "timestamp": "2026-08-09T16:14:00.000",
  "status": 409,
  "error": "Conflict",
  "message": "No se puede cambiar el estado fisico porque el equipo tiene reservas activas. Cancélalas o elimínalas primero usando el endpoint admin de reservas."
}
```

### GET /api/equipos/{id}
- Auth: Public
- JWT: Not required

#### Path variables
- `id` (`Long`): required.

#### Successful response
- Status: `200 OK`
- Body:
```json
{
  "id": 1,
  "nombre": "Microscopio Olympus",
  "identificador": "SN-001",
  "categoria": {
    "id": 2,
    "nombre": "Optica"
  },
  "estadoFisico": "DISPONIBLE",
  "fechaRegistro": "2026-08-09T10:15:30",
  "fechaActualizacion": "2026-08-09T10:15:30"
}
```

#### Errors
- `404 Not Found`: equipment does not exist.
- `500 Internal Server Error`: unexpected failure.

#### Example request
```http
GET /api/equipos/1
```

#### Example success response
```json
{
  "id": 1,
  "nombre": "Microscopio Olympus",
  "identificador": "SN-001",
  "categoria": {
    "id": 2,
    "nombre": "Optica"
  },
  "estadoFisico": "DISPONIBLE",
  "fechaRegistro": "2026-08-09T10:15:30",
  "fechaActualizacion": "2026-08-09T10:15:30"
}
```

#### Example error response
```json
{
  "timestamp": "2026-08-09T16:15:00.000",
  "status": 404,
  "error": "Not Found",
  "message": "El equipo con id 999 no existe"
}
```

### DELETE /api/equipos/{id}
- Auth: JWT required
- Role: `ADMIN`

#### Path variables
- `id` (`Long`): required.

#### Successful response
- Status: `204 No Content`
- Body: none.

#### Errors
- `403 Forbidden`: missing/invalid token, expired token, or user without `ADMIN` role.
- `404 Not Found`: equipment does not exist.
- `409 Conflict`: the equipment has associated reservations (active or cancelled). The service rejects physical deletion because it would break historical integrity; the intended path is to change `estadoFisico` to `DE_BAJA` via PUT.
- `500 Internal Server Error`: unexpected failure.

#### Example request
```http
DELETE /api/equipos/1
Authorization: Bearer <jwt>
```

#### Example success response
```http
204 No Content
```

#### Example error response
```json
{
  "timestamp": "2026-08-09T16:16:00.000",
  "status": 409,
  "error": "Conflict",
  "message": "No se puede borrar el equipo porque tiene reservas asociadas; usa PUT para cambiar su estadoFisico a DE_BAJA"
}
```

### GET /api/equipos
- Auth: Public
- JWT: Not required

#### Query params
- `page` (`int`, optional, default `0`)
- `size` (`int`, optional, default `10`)
- `categoriaId` (`Long`, optional)
- `estadoFisico` (`EstadoFisico`, optional; values: `DISPONIBLE`, `MANTENIMIENTO`, `DE_BAJA`)

#### Successful response
- Status: `200 OK`
- Body: standard Spring Data `Page<EquipoResponseDTO>` serialization.

Example shape:
```json
{
  "content": [
    {
      "id": 1,
      "nombre": "Microscopio Olympus",
      "identificador": "SN-001",
      "categoria": {
        "id": 2,
        "nombre": "Optica"
      },
      "estadoFisico": "DISPONIBLE",
      "fechaRegistro": "2026-08-09T10:15:30",
      "fechaActualizacion": "2026-08-09T10:15:30"
    }
  ],
  "number": 0,
  "size": 10,
  "totalElements": 1,
  "totalPages": 1,
  "first": true,
  "last": true,
  "numberOfElements": 1,
  "empty": false
}
```

#### Errors
- `400 Bad Request`: invalid `page`/`size` format, invalid `estadoFisico` enum value, or any other query binding error.
- `500 Internal Server Error`: unexpected failure.

#### Example request
```http
GET /api/equipos?page=0&size=10&categoriaId=2&estadoFisico=DISPONIBLE
```

#### Example success response
```json
{
  "content": [
    {
      "id": 1,
      "nombre": "Microscopio Olympus",
      "identificador": "SN-001",
      "categoria": {
        "id": 2,
        "nombre": "Optica"
      },
      "estadoFisico": "DISPONIBLE",
      "fechaRegistro": "2026-08-09T10:15:30",
      "fechaActualizacion": "2026-08-09T10:15:30"
    }
  ],
  "number": 0,
  "size": 10,
  "totalElements": 1,
  "totalPages": 1,
  "first": true,
  "last": true,
  "numberOfElements": 1,
  "empty": false
}
```

#### Example error response
```json
{
  "timestamp": "2026-08-09T16:17:00.000",
  "status": 400,
  "error": "Bad Request",
  "errores": {
    "estadoFisico": "Failed to convert value of type 'java.lang.String' to required type 'co.edu.lab.sistemas.enums.EstadoFisico'"
  }
}
```

## 3. Categorias

### POST /api/categorias
- Auth: JWT required
- Role: `ADMIN`

#### Request body
```json
{
  "nombre": "string (required, not blank)",
  "descripcion": "string (optional)"
}
```

#### Successful response
- Status: `201 Created`
- Body:
```json
{
  "id": 1,
  "nombre": "Optica",
  "descripcion": "Equipos de laboratorio de optica"
}
```

#### Errors
- `400 Bad Request`: validation failure in `nombre`.
- `403 Forbidden`: missing/invalid token, expired token, or user without `ADMIN` role.
- `500 Internal Server Error`: unexpected failure.

#### Example request
```http
POST /api/categorias
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "nombre": "Optica",
  "descripcion": "Equipos de laboratorio de optica"
}
```

#### Example success response
```json
{
  "id": 1,
  "nombre": "Optica",
  "descripcion": "Equipos de laboratorio de optica"
}
```

#### Example error response
```json
{
  "timestamp": "2026-08-09T16:18:00.000",
  "status": 400,
  "error": "Bad Request",
  "errores": {
    "nombre": "El nombre de la categoria es obligatorio"
  }
}
```

### GET /api/categorias
- Auth: Public
- JWT: Not required

#### Successful response
- Status: `200 OK`
- Body: array of `CategoriaResponseDTO`
```json
[
  {
    "id": 1,
    "nombre": "Optica",
    "descripcion": "Equipos de laboratorio de optica"
  }
]
```

#### Errors
- `500 Internal Server Error`: unexpected failure.

#### Example request
```http
GET /api/categorias
```

#### Example success response
```json
[
  {
    "id": 1,
    "nombre": "Optica",
    "descripcion": "Equipos de laboratorio de optica"
  }
]
```

#### Example error response
```json
{
  "timestamp": "2026-08-09T16:19:00.000",
  "status": 500,
  "error": "Internal Server Error",
  "message": "Ocurrio un error inesperado"
}
```

### DELETE /api/categorias/{id}
- Auth: JWT required
- Role: `ADMIN`

#### Path variables
- `id` (`Long`): required.

#### Successful response
- Status: `204 No Content`
- Body: none.

#### Errors
- `403 Forbidden`: missing/invalid token, expired token, or user without `ADMIN` role.
- `404 Not Found`: category does not exist.
- `409 Conflict`: the category has at least one equipment associated. The service requires reassigning or deleting those equipments first.
- `500 Internal Server Error`: unexpected failure.

#### Example request
```http
DELETE /api/categorias/1
Authorization: Bearer <jwt>
```

#### Example success response
```http
204 No Content
```

#### Example error response
```json
{
  "timestamp": "2026-08-09T16:20:00.000",
  "status": 409,
  "error": "Conflict",
  "message": "No se puede borrar la categoria porque tiene equipos asociados; reasigna o elimina esos equipos primero"
}
```

## 4. Reservas

### POST /api/reservas
- Auth: Public
- JWT: Not required

#### Request body
```json
{
  "equipoId": 1,
  "usuarioNombre": "string (required, not blank)",
  "googleIdToken": "string (required, not blank)",
  "fechaHoraInicio": "2026-08-09T10:00:00",
  "fechaHoraFin": "2026-08-09T12:00:00"
}
```

Fields:
- `equipoId` (`Long`): required.
- `usuarioNombre` (`String`): required, cannot be blank.
- `googleIdToken` (`String`): required, cannot be blank. This is the raw Google `id_token` obtained client-side from Google Sign-In (OpenID Connect). The backend verifies its signature and audience against the app's OAuth Client ID, and extracts the email from its payload — it does NOT trust any client-supplied email. The extracted email must belong to the `@udea.edu.co` domain or the request is rejected.
- `fechaHoraInicio` (`LocalDateTime`): required.
- `fechaHoraFin` (`LocalDateTime`): required.

**Breaking change from previous version:** `usuarioCorreo` no longer exists as a request field. The frontend must trigger Google Sign-In, obtain the `id_token`, and send it as `googleIdToken` instead of collecting a free-text email.

#### Successful response
- Status: `201 Created`
- Body:
```json
{
  "id": 1,
  "equipo": {
    "id": 1,
    "nombre": "Microscopio Olympus"
  },
  "usuarioNombre": "Juan Perez",
  "fechaHoraInicio": "2026-08-09T10:00:00",
  "fechaHoraFin": "2026-08-09T12:00:00",
  "estadoReserva": "ACTIVA",
  "fechaCreacion": "2026-08-09T09:55:00"
}
```

Important: the email extracted from `googleIdToken` is stored internally as `usuarioCorreo`, but it is not returned in the response DTO.

#### Errors
- `400 Bad Request`: validation failure in request body.
- `400 Bad Request`: `fechaHoraFin` is not strictly after `fechaHoraInicio`.
- `401 Unauthorized`: `googleIdToken` is malformed, invalid, expired, or the extracted email is not `@udea.edu.co`.
- `404 Not Found`: referenced equipment does not exist.
- `409 Conflict`: the equipment is not available because it is in maintenance or decommissioned; or the requested time range overlaps with another active reservation.
- `500 Internal Server Error`: unexpected failure (should now only happen for truly unforeseen failures, not for malformed tokens).

#### Example request
```http
POST /api/reservas
Content-Type: application/json

{
  "equipoId": 1,
  "usuarioNombre": "Juan Perez",
  "googleIdToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "fechaHoraInicio": "2026-08-09T10:00:00",
  "fechaHoraFin": "2026-08-09T12:00:00"
}
```

#### Example success response
```json
{
  "id": 1,
  "equipo": {
    "id": 1,
    "nombre": "Microscopio Olympus"
  },
  "usuarioNombre": "Juan Perez",
  "fechaHoraInicio": "2026-08-09T10:00:00",
  "fechaHoraFin": "2026-08-09T12:00:00",
  "estadoReserva": "ACTIVA",
  "fechaCreacion": "2026-08-09T09:55:00"
}
```

#### Example error response
```json
{
  "timestamp": "2026-08-09T16:21:00.000",
  "status": 409,
  "error": "Conflict",
  "message": "La reserva solicitada choca con el horario de una reserva activa existente"
}
```

### DELETE /api/reservas/{id}
- Auth: Public
- JWT: Not required

#### Path variables
- `id` (`Long`): required.

#### Headers
- `X-Google-Id-Token` (`String`, required): the requester's Google `id_token`. The backend verifies it the same way as in `POST /api/reservas`, extracts the email, and compares it (case-insensitive) against the reservation's stored `usuarioCorreo`. Only the person who made the reservation (same Google account) can cancel it.

**Breaking change from previous version:** the `correo` query param no longer exists. Do not send the email as plain text — the frontend must trigger Google Sign-In again (or reuse a still-valid session/token) and send the `id_token` via this header. It is intentionally a header and not a query param, since `id_token` values are long, sensitive, and shouldn't end up in server access logs or browser history.

#### Successful response
- Status: `200 OK`
- Body: `ReservaResponseDTO` (without `usuarioCorreo`).

```json
{
  "id": 1,
  "equipo": {
    "id": 1,
    "nombre": "Microscopio Olympus"
  },
  "usuarioNombre": "Juan Perez",
  "fechaHoraInicio": "2026-08-09T10:00:00",
  "fechaHoraFin": "2026-08-09T12:00:00",
  "estadoReserva": "CANCELADA",
  "fechaCreacion": "2026-08-09T09:55:00"
}
```

#### Errors
- `400 Bad Request`: missing `X-Google-Id-Token` header.
- `401 Unauthorized`: `X-Google-Id-Token` is malformed, invalid, expired, or the extracted email is not `@udea.edu.co`.
- `403 Forbidden`: the token is valid, but its email does not match the reservation's stored email (someone else's reservation).
- `404 Not Found`: reservation does not exist.
- `409 Conflict`: reservation is already cancelled.
- `500 Internal Server Error`: unexpected failure.

#### Example request
```http
DELETE /api/reservas/1
X-Google-Id-Token: eyJhbGciOiJSUzI1NiIsImtpZCI6...
```

#### Example success response
```json
{
  "id": 1,
  "equipo": {
    "id": 1,
    "nombre": "Microscopio Olympus"
  },
  "usuarioNombre": "Juan Perez",
  "fechaHoraInicio": "2026-08-09T10:00:00",
  "fechaHoraFin": "2026-08-09T12:00:00",
  "estadoReserva": "CANCELADA",
  "fechaCreacion": "2026-08-09T09:55:00"
}
```

#### Example error response
```json
{
  "timestamp": "2026-08-09T16:22:00.000",
  "status": 403,
  "error": "Forbidden",
  "message": "no tienes permiso para cancelar esta reserva"
}
```

### DELETE /api/reservas/admin/{id}
- Auth: JWT required
- Role: `ADMIN`
- Note: this endpoint physically deletes the reservation. It is an admin-only endpoint that exists in the current codebase.

#### Path variables
- `id` (`Long`): required.

#### Successful response
- Status: `204 No Content`
- Body: none.

#### Errors
- `403 Forbidden`: missing/invalid token, expired token, or user without `ADMIN` role.
- `404 Not Found`: reservation does not exist.
- `500 Internal Server Error`: unexpected failure.

#### Example request
```http
DELETE /api/reservas/admin/1
Authorization: Bearer <jwt>
```

#### Example success response
```http
204 No Content
```

#### Example error response
```json
{
  "timestamp": "2026-08-09T16:23:00.000",
  "status": 403,
  "error": "Forbidden",
  "message": "No tienes permiso para realizar esta operacion"
}
```

### GET /api/reservas
- Auth: Public
- JWT: Not required

#### Query params
- `page` (`int`, optional, default `0`)
- `size` (`int`, optional, default `10`)
- `equipoId` (`Long`, optional)
- `estadoReserva` (`EstadoReserva`, optional; values: `ACTIVA`, `CANCELADA`)

#### Successful response
- Status: `200 OK`
- Body: standard Spring Data `Page<ReservaResponseDTO>` serialization.

Example shape:
```json
{
  "content": [
    {
      "id": 1,
      "equipo": {
        "id": 1,
        "nombre": "Microscopio Olympus"
      },
      "usuarioNombre": "Juan Perez",
      "fechaHoraInicio": "2026-08-09T10:00:00",
      "fechaHoraFin": "2026-08-09T12:00:00",
      "estadoReserva": "ACTIVA",
      "fechaCreacion": "2026-08-09T09:55:00"
    }
  ],
  "number": 0,
  "size": 10,
  "totalElements": 1,
  "totalPages": 1,
  "first": true,
  "last": true,
  "numberOfElements": 1,
  "empty": false
}
```

#### Errors
- `400 Bad Request`: invalid `page`/`size` format, invalid `equipoId` format, or invalid `estadoReserva` enum value.
- `500 Internal Server Error`: unexpected failure.

#### Example request
```http
GET /api/reservas?page=0&size=10&equipoId=1&estadoReserva=ACTIVA
```

#### Example success response
```json
{
  "content": [
    {
      "id": 1,
      "equipo": {
        "id": 1,
        "nombre": "Microscopio Olympus"
      },
      "usuarioNombre": "Juan Perez",
      "fechaHoraInicio": "2026-08-09T10:00:00",
      "fechaHoraFin": "2026-08-09T12:00:00",
      "estadoReserva": "ACTIVA",
      "fechaCreacion": "2026-08-09T09:55:00"
    }
  ],
  "number": 0,
  "size": 10,
  "totalElements": 1,
  "totalPages": 1,
  "first": true,
  "last": true,
  "numberOfElements": 1,
  "empty": false
}
```

#### Example error response
```json
{
  "timestamp": "2026-08-09T16:24:00.000",
  "status": 400,
  "error": "Bad Request",
  "errores": {
    "estadoReserva": "Failed to convert value of type 'java.lang.String' to required type 'co.edu.lab.sistemas.enums.EstadoReserva'"
  }
}
```

## 5. Estadisticas

### GET /api/estadisticas/top-equipos
- Auth: Public
- JWT: Not required

#### Query params
- `desde` (`LocalDateTime`, optional)
- `hasta` (`LocalDateTime`, optional)

Date format for query params:
- ISO-8601 local date-time, for example: `2026-08-01T00:00:00`
- No timezone offset is used because the backend maps these values to `LocalDateTime`.

#### Successful response
- Status: `200 OK`
- Body:
```json
[
  {
    "equipoId": 1,
    "nombre": "Microscopio Olympus",
    "totalReservas": 12
  },
  {
    "equipoId": 2,
    "nombre": "Centrifuga X200",
    "totalReservas": 9
  }
]
```

#### Errors
- `400 Bad Request`: invalid date format in `desde` or `hasta`.
- `400 Bad Request`: both dates are present and `desde` is after `hasta`.
- `500 Internal Server Error`: unexpected failure.

#### Example request
```http
GET /api/estadisticas/top-equipos?desde=2026-08-01T00:00:00&hasta=2026-08-31T23:59:59
```

#### Example success response
```json
[
  {
    "equipoId": 1,
    "nombre": "Microscopio Olympus",
    "totalReservas": 12
  },
  {
    "equipoId": 2,
    "nombre": "Centrifuga X200",
    "totalReservas": 9
  }
]
```

#### Example error response
```json
{
  "timestamp": "2026-08-09T16:25:00.000",
  "status": 400,
  "error": "Bad Request",
  "message": "El rango de fechas es invalido: desde no puede ser posterior a hasta"
}
```

## Notes for frontend integration

### JWT usage
- Send the token in the `Authorization` header.
- Exact format:
```http
Authorization: Bearer <token>
```

### Invalid or expired token in protected endpoints
- Protected endpoints are the admin-only routes.
- If the token is invalid, expired, missing, or the user does not have `ADMIN`, the request is rejected with `403 Forbidden` and the global handler returns:
```json
{
  "timestamp": "...",
  "status": 403,
  "error": "Forbidden",
  "message": "No tienes permiso para realizar esta operacion"
}
```

### Date and time format
- Request bodies and query params that use `LocalDateTime` expect ISO-8601 local date-time strings.
- Example: `2026-08-09T10:00:00`
- Responses also serialize `LocalDateTime` values in ISO-8601 local date-time format.
- There is no timezone or offset in the backend model because the code uses `LocalDateTime`, not `ZonedDateTime` or `OffsetDateTime`.

### Reservation email visibility
- `usuarioCorreo` is stored in the `Reserva` entity, populated from the verified Google `id_token` (never from client-supplied text).
- It is not exposed in any reservation read response DTO.
- Current public read responses for reservations include only `id`, `equipo`, `usuarioNombre`, `fechaHoraInicio`, `fechaHoraFin`, `estadoReserva` and `fechaCreacion`.
- The verified email is used as identity proof both when creating and when cancelling a reservation.

### Google Sign-In flow (new — required for creating and cancelling reservations)
- Both `POST /api/reservas` and `DELETE /api/reservas/{id}` now require a Google `id_token`, obtained client-side via Google Sign-In (OpenID Connect), restricted to the `@udea.edu.co` domain.
- This is separate and unrelated to the admin JWT flow (`POST /api/auth/login` + `Authorization: Bearer <jwt>`), which continues to use password login for `ADMIN` users only. The two tokens are never interchangeable — do not send a `googleIdToken` in the `Authorization` header, or the admin JWT filter will try (and fail) to parse it.
- `POST /api/reservas` expects the token in the JSON body field `googleIdToken`.
- `DELETE /api/reservas/{id}` expects the token in the `X-Google-Id-Token` header.
- UI implication: the reservation form and the cancel-reservation flow both need a "Sign in with Google" step before submission (the reserving user does not have a password-based account — Google Sign-In is their only identity mechanism). Consider caching the token/session client-side during the visit so the user isn't forced to sign in twice if they create and then cancel in the same session, keeping in mind Google `id_token`s expire after roughly one hour.
- A `401 Unauthorized` from either endpoint means the token itself is unusable (malformed/expired/wrong domain) — the UI should prompt to sign in again. A `403 Forbidden` from cancel means the token is valid but belongs to a different person than the one who made the reservation — the UI should explain that only the original requester can cancel it, not prompt for re-authentication.

### Extra endpoint to be aware of
- `DELETE /api/reservas/admin/{id}` exists in the current backend and permanently deletes a reservation.
- If the frontend does not need admin hard-delete, it can ignore this endpoint.
