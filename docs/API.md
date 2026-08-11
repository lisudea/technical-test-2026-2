# Referencia de la API

Base URL: `http://localhost:8080`

Todos los cuerpos son `application/json`. Las fechas usan **ISO-8601 local, sin zona horaria**: `2026-09-01T10:00:00`.

> Alternativa interactiva: **Swagger UI** en http://localhost:8080/swagger-ui.html

---

## Índice

- [Convenciones](#convenciones)
- [Equipos](#equipos)
- [Reservas](#reservas)
- [Estadísticas](#estadísticas)
- [Autenticación](#autenticación)
- [Catálogo de errores](#catálogo-de-errores)

---

## Convenciones

### Enumerados

| Enum | Valores |
|---|---|
| `category` | `MICROCONTROLLERS`, `VR`, `NETWORKS` |
| `status` (equipo) | `AVAILABLE`, `RESERVED`, `MAINTENANCE` |
| `status` (reserva) | `ACTIVE`, `CANCELLED` |

### Autenticación

Las peticiones `GET` son siempre públicas.

| Acción | Endpoints | Por defecto | Propiedad |
|---|---|---|---|
| Consultar | todos los `GET` | 🔓 pública | — |
| Reservar y cancelar | `POST` y `DELETE /api/reservations` | 🔓 pública | `app.security.protect-reservations=false` |
| Gestionar el inventario | `POST` y `PUT /api/equipment` | 🔒 requiere sesión | `app.security.protect-equipment=true` |

Sin sesión, escribir sobre `/api/equipment` responde **403**. Para probarlo sin token, arrancar el backend con `PROTECT_EQUIPMENT=false`.

Si se envía un JWT válido, **la identidad se toma del token** y se ignoran los campos `userName`/`userEmail` del cuerpo.

---

## Equipos

### `GET /api/equipment` — Listado paginado y filtrable

**Parámetros de consulta**

| Nombre | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `category` | enum | — | Filtra por categoría |
| `status` | enum | — | Filtra por estado |
| `page` | int | `0` | Página (base 0) |
| `size` | int | `12` | Tamaño de página (máx. 100) |
| `sort` | string | — | `campo,asc|desc`, p. ej. `name,asc` |

**Petición**

```bash
curl "http://localhost:8080/api/equipment?category=VR&status=AVAILABLE&page=0&size=2&sort=name,asc"
```

**Respuesta `200 OK`**

```json
{
  "content": [
    {
      "id": 6,
      "name": "Meta Quest 3",
      "serialNumber": "VR-MQ3-0006",
      "category": "VR",
      "status": "AVAILABLE",
      "createdAt": "2026-08-10T09:12:44.812",
      "updatedAt": "2026-08-10T09:12:44.812"
    },
    {
      "id": 8,
      "name": "Valve Index",
      "serialNumber": "VR-VAL-0008",
      "category": "VR",
      "status": "AVAILABLE",
      "createdAt": "2026-08-10T09:12:44.812",
      "updatedAt": "2026-08-10T09:12:44.812"
    }
  ],
  "totalElements": 2,
  "totalPages": 1,
  "number": 0,
  "size": 2,
  "first": true,
  "last": true,
  "numberOfElements": 2,
  "empty": false
}
```

---

### `GET /api/equipment/{id}` — Detalle

```bash
curl http://localhost:8080/api/equipment/1
```

`200 OK` con el objeto del equipo · `404` si no existe.

---

### `POST /api/equipment` — Registrar

**Cuerpo**

| Campo | Tipo | Obligatorio | Reglas |
|---|---|---|---|
| `name` | string | sí | no vacío, máx. 120 |
| `serialNumber` | string | sí | no vacío, máx. 80, **único** |
| `category` | enum | sí | — |
| `status` | enum | sí | — |

```bash
curl -X POST http://localhost:8080/api/equipment \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Arduino Nano",
    "serialNumber": "MCU-NAN-9001",
    "category": "MICROCONTROLLERS",
    "status": "AVAILABLE"
  }'
```

**`201 Created`**

```json
{
  "id": 13,
  "name": "Arduino Nano",
  "serialNumber": "MCU-NAN-9001",
  "category": "MICROCONTROLLERS",
  "status": "AVAILABLE",
  "createdAt": "2026-08-10T10:02:11.004",
  "updatedAt": "2026-08-10T10:02:11.004"
}
```

**`400 Bad Request`** — campos inválidos

```json
{
  "timestamp": "2026-08-10T10:03:02.551",
  "status": 400,
  "error": "Bad Request",
  "message": "Hay campos invalidos en la peticion",
  "path": "/api/equipment",
  "errors": [
    { "field": "name", "message": "El nombre del equipo es obligatorio" },
    { "field": "category", "message": "La categoria es obligatoria (MICROCONTROLLERS, VR o NETWORKS)" }
  ]
}
```

**`409 Conflict`** — número de serie repetido

```json
{
  "status": 409,
  "error": "Conflict",
  "message": "Ya existe un registro con esos datos. Revisa que el numero de serie no este repetido.",
  "path": "/api/equipment",
  "errors": []
}
```

---

### `PUT /api/equipment/{id}` — Actualizar

Mismo cuerpo que `POST`. Devuelve `200` con el equipo actualizado, o `404`.

```bash
curl -X PUT http://localhost:8080/api/equipment/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Arduino Uno R3",
    "serialNumber": "MCU-ARD-0001",
    "category": "MICROCONTROLLERS",
    "status": "MAINTENANCE"
  }'
```

---

## Reservas

### `GET /api/reservations` — Todas

```bash
curl http://localhost:8080/api/reservations
```

**`200 OK`**

```json
[
  {
    "id": 1,
    "equipmentId": 1,
    "equipmentName": "Arduino Uno R3",
    "userId": 1,
    "userName": "Usuario Demo LIS",
    "userEmail": "demo.lis@udea.edu.co",
    "startTime": "2026-08-11T08:00:00",
    "endTime": "2026-08-11T10:00:00",
    "status": "ACTIVE",
    "createdAt": "2026-08-10T09:12:45.117"
  }
]
```

---

### `GET /api/reservations/equipment/{equipmentId}` — Por equipo

Útil para mostrar en la interfaz las franjas ya ocupadas antes de reservar.

```bash
curl http://localhost:8080/api/reservations/equipment/1
```

`200 OK` con el array · `404` si el equipo no existe.

---

### `POST /api/reservations` — Crear ⭐

**Cuerpo**

| Campo | Tipo | Obligatorio | Reglas |
|---|---|---|---|
| `equipmentId` | number | sí | debe existir |
| `startTime` | datetime | sí | en el futuro |
| `endTime` | datetime | sí | en el futuro y **posterior** a `startTime` |
| `userName` | string | solo sin autenticar | máx. 120 |
| `userEmail` | string | solo sin autenticar | formato de correo válido |

**Modo abierto (sin token)**

```bash
curl -X POST http://localhost:8080/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "equipmentId": 1,
    "userName": "Carlos Forero",
    "userEmail": "carlos@udea.edu.co",
    "startTime": "2026-09-01T10:00:00",
    "endTime":   "2026-09-01T11:00:00"
  }'
```

**Modo protegido (con token)** — `userName`/`userEmail` sobran:

```bash
curl -X POST http://localhost:8080/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TU_JWT>" \
  -d '{
    "equipmentId": 1,
    "startTime": "2026-09-01T10:00:00",
    "endTime":   "2026-09-01T11:00:00"
  }'
```

**`201 Created`**

```json
{
  "id": 7,
  "equipmentId": 1,
  "equipmentName": "Arduino Uno R3",
  "userId": 2,
  "userName": "Carlos Forero",
  "userEmail": "carlos@udea.edu.co",
  "startTime": "2026-09-01T10:00:00",
  "endTime": "2026-09-01T11:00:00",
  "status": "ACTIVE",
  "createdAt": "2026-08-10T10:15:33.902"
}
```

#### ⭐ `409 Conflict` — la regla de negocio crítica

Enviar una segunda reserva del **mismo equipo** con una franja que **se cruce**:

```bash
curl -X POST http://localhost:8080/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "equipmentId": 1,
    "userName": "Ana",
    "userEmail": "ana@udea.edu.co",
    "startTime": "2026-09-01T10:30:00",
    "endTime":   "2026-09-01T11:30:00"
  }'
```

```json
{
  "timestamp": "2026-08-10T10:16:04.221",
  "status": 409,
  "error": "Conflict",
  "message": "El equipo con id 1 ya tiene una reserva que se cruza con la franja horaria solicitada",
  "path": "/api/reservations",
  "errors": []
}
```

> **Importante:** `11:00–12:00` **no** produce conflicto con `10:00–11:00`. Son franjas contiguas, no solapadas. Ver el diagrama en el [README](../README.md#la-regla-de-negocio-crítica-solapamiento-de-reservas).

#### `400 Bad Request` — fechas incoherentes

Cuando `startTime >= endTime`:

```json
{
  "status": 400,
  "message": "La fecha y hora de inicio debe ser anterior a la de fin",
  "path": "/api/reservations",
  "errors": []
}
```

Cuando las fechas están en el pasado o faltan campos, llega con `errors` detallado.

#### `400` — falta identificación

Petición anónima sin `userName`/`userEmail`:

```json
{
  "status": 400,
  "message": "Debes indicar 'userName' y 'userEmail' para reservar, o iniciar sesion para que se tomen de tu cuenta"
}
```

#### `404` — equipo inexistente

```json
{ "status": 404, "message": "Equipment with id 99 not found" }
```

---

### `DELETE /api/reservations/{id}` — Cancelar

Cancelación **lógica**: la reserva pasa a `CANCELLED` y su franja queda libre.

| Parámetro | Cuándo |
|---|---|
| `email` | Obligatorio si la petición no está autenticada. Debe coincidir con el dueño. |

```bash
# Sin token
curl -X DELETE "http://localhost:8080/api/reservations/7?email=carlos@udea.edu.co"

# Con token (el email sale del JWT)
curl -X DELETE http://localhost:8080/api/reservations/7 \
  -H "Authorization: Bearer <TU_JWT>"
```

- `204 No Content` — cancelada (o ya lo estaba: es idempotente)
- `403 Forbidden` — el correo no coincide con el dueño
- `404 Not Found` — la reserva no existe

```json
{
  "status": 403,
  "error": "Forbidden",
  "message": "Solo puedes cancelar las reservas creadas con tu propio correo",
  "path": "/api/reservations/7"
}
```

---

## Estadísticas

### `GET /api/statistics/top-equipment` — Top 5 *(bonus)*

Equipos más solicitados **históricamente**: cuenta todas las reservas, incluidas las canceladas.

```bash
curl http://localhost:8080/api/statistics/top-equipment
```

**`200 OK`**

```json
[
  { "equipmentId": 1, "equipmentName": "Arduino Uno R3", "reservationCount": 4 },
  { "equipmentId": 6, "equipmentName": "Meta Quest 3",   "reservationCount": 2 },
  { "equipmentId": 3, "equipmentName": "ESP32 DevKit v1","reservationCount": 1 }
]
```

Solo aparecen equipos con al menos una reserva.

---

## Autenticación

### `GET /oauth2/authorization/google` — Iniciar sesión *(bonus)*

Abrir **en el navegador**. Solo se aceptan cuentas `@udea.edu.co`; cualquier otra es rechazada.

Tras el login correcto:

- **Navegador** → redirige a `FRONTEND_REDIRECT_URI?token=<jwt>` (por defecto `http://localhost:5173/auth/callback`)
- **Cliente con `Accept: application/json`** → responde:

```json
{ "token": "eyJhbGciOiJIUzM4NCJ9...", "email": "carlos@udea.edu.co", "name": "Carlos Forero" }
```

El JWT se firma con **HS384** y dura **1 hora**. Contiene `sub` (email), `name` y `role`.

### `GET /api/auth/me` — Usuario actual

```bash
curl http://localhost:8080/api/auth/me -H "Authorization: Bearer <TU_JWT>"
```

```json
{ "email": "carlos@udea.edu.co", "name": "Carlos Forero", "role": "USER" }
```

`401` si no hay token o ha expirado.

---

## Catálogo de errores

Todas las respuestas de error comparten esta forma:

```json
{
  "timestamp": "2026-08-10T10:16:04.221",
  "status": 409,
  "error": "Conflict",
  "code": "RESERVATION_OVERLAP",
  "message": "Texto legible para mostrar al usuario",
  "path": "/api/reservations",
  "errors": [ { "field": "...", "message": "..." } ]
}
```

`errors` solo se rellena en los fallos de validación; en el resto es un array vacío.

### Códigos de negocio (`code`)

El estado HTTP no siempre basta: "la franja está ocupada" y "el equipo está en mantenimiento" son ambas un `409`. El campo `code` identifica la situación de forma estable, sin depender del idioma del mensaje. **Los clientes deben decidir sobre `code`, no sobre el texto de `message`.**

| `code` | HTTP | Cuándo |
|---|---|---|
| `RESERVATION_OVERLAP` | `409` | **La franja se cruza con otra reserva activa** |
| `EQUIPMENT_IN_MAINTENANCE` | `409` | El equipo está en mantenimiento y no admite reservas |
| `DUPLICATE_RESOURCE` | `409` | Número de serie ya registrado |
| `INVALID_TIME_RANGE` | `400` | `startTime` no es anterior a `endTime` |
| `RESERVATION_TOO_LONG` | `400` | Supera la duración máxima (8 h por defecto) |
| `IDENTITY_REQUIRED` | `400` | Petición anónima sin `userName` ni `userEmail` |
| `VALIDATION_FAILED` | `400` | Fallo de `@Valid`; el detalle va en `errors[]` |
| `MALFORMED_REQUEST` | `400` | JSON o formato de fecha inválido |
| `INVALID_PARAMETER` | `400` | Valor de enum no reconocido en un parámetro |
| `EQUIPMENT_NOT_FOUND` · `RESERVATION_NOT_FOUND` · `USER_NOT_FOUND` | `404` | El recurso no existe |
| `ROUTE_NOT_FOUND` | `404` | Ruta inexistente |
| `ACCESS_DENIED` | `403` | Cancelar una reserva ajena, o gestionar el inventario sin sesión |
| `INTERNAL_ERROR` | `500` | Error inesperado. El detalle queda en el log, no se expone |

### Resumen por código HTTP

| Código | Situación típica |
|---|---|
| `400` | Validación fallida · rango horario incoherente · reserva demasiado larga · falta identificación · enum o JSON inválido |
| `401` | Token ausente o caducado en un endpoint que exige sesión |
| `403` | Cancelar una reserva ajena · gestionar el inventario sin sesión |
| `404` | Equipo, reserva o usuario inexistente · ruta desconocida |
| `409` | **Franja horaria ocupada** · equipo en mantenimiento · `serialNumber` duplicado |
| `500` | Error inesperado. El detalle queda en el log del servidor, no se expone |