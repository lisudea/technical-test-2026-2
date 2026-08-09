# Contrato API

Base local: `http://localhost:8080/api/v1`. Salvo los endpoints públicos indicados, enviar `Authorization: Bearer <accessToken>`. Fechas en ISO-8601 UTC. Todos los requests pueden incluir `X-Correlation-ID`; la respuesta lo devuelve.

## Autenticación

| Método | Ruta | Acceso | Cuerpo/resultado |
|---|---|---|---|
| POST | `/auth/login` | público | `{email,password}` → access token, usuario y cookie refresh |
| POST | `/auth/google` | público | `{credential}` (Google ID token verificado) |
| POST | `/auth/refresh` | cookie | rota refresh y entrega access token nuevo |
| POST | `/auth/logout` | autenticado | revoca sesión y limpia cookie |
| POST | `/auth/logout-all` | autenticado | revoca todas las sesiones |
| POST | `/auth/forgot-password` | público | `{email}`; respuesta no enumera cuentas |
| POST | `/auth/reset-password` | público | `{token,newPassword}` |
| POST | `/auth/set-password` | autenticado | cuenta Google sin password |
| POST | `/auth/change-password` | autenticado | `{oldPassword,newPassword}` |

Respuesta auth:

```json
{
  "accessToken": "eyJ...",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "user": { "id": 1, "email": "usuario.demo@udea.edu.co", "roles": ["USUARIO"], "role": "USER", "languageCode": "es" }
}
```

## Equipos y catálogos

`GET /equipment?page=1&pageSize=12&search=arduino&category=MICROCONTROLADORES&status=AVAILABLE&operationalStatus=OPERATIVO&sort=name,asc`

Devuelve `{items,page,pageSize,totalItems,totalPages}`. `status` visual se deriva del estado operativo y reservas actuales. Sort solo acepta `name`, `inventoryCode`, `createdAt` y `updatedAt`.

| Método | Ruta | Rol |
|---|---|---|
| GET | `/equipment`, `/equipment/{id}` | autenticado |
| POST | `/equipment` | ADMINISTRADOR |
| PUT | `/equipment/{id}` | ADMINISTRADOR |
| PATCH | `/equipment/{id}/status` | ADMINISTRADOR |
| GET | `/catalogs/categories`, `/locations`, `/equipment-statuses`, `/languages` | autenticado |

Ejemplo de entrada de equipo:

```json
{
  "inventoryCode": "LIS-DEMO-099",
  "name": "Equipo de demostración",
  "description": "Creado desde Swagger",
  "serialNumber": "DEMO-099",
  "macAddress": null,
  "imageUrl": null,
  "categoryId": 1,
  "locationId": 1,
  "operationalStatus": "OPERATIVO"
}
```

## Reservas

```json
POST /reservations
{
  "equipmentIds": [1, 2],
  "startsAt": "2035-04-10T14:00:00Z",
  "endsAt": "2035-04-10T16:00:00Z",
  "notes": "Práctica académica"
}
```

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/reservations` | crear atómicamente; 201 o 409 |
| GET | `/reservations/me` | reservas propias |
| GET | `/reservations/{id}` | propietario o admin |
| POST | `/reservations/{id}/cancel` | `{reason}` opcional; solo futura |
| GET | `/equipment/{id}/busy-slots` | intervalos confirmados |
| GET | `/equipment/{id}/availability?startsAt=…&endsAt=…` | booleano server-side |

## Dashboard, perfil y administración

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/dashboard/summary` | autenticado |
| GET | `/statistics/top-equipment?limit=5` | autenticado |
| GET/PATCH | `/profile` | autenticado |
| GET/PATCH | `/admin/configuration/{key}` | ADMINISTRADOR |
| GET | `/admin/audit?page=1&pageSize=50` | ADMINISTRADOR |

## Errores

Formato compatible con Problem Details:

```json
{
  "type": "about:blank",
  "title": "Conflict",
  "status": 409,
  "detail": "One or more equipment items are already reserved for that interval.",
  "instance": "/api/v1/reservations",
  "code": "RESERVATION_CONFLICT",
  "correlationId": "20b85df7-0d08-46dd-a352-8bf2c6b30f45",
  "fieldErrors": []
}
```

Códigos relevantes: `INVALID_CREDENTIALS` (401), `ACCOUNT_INACTIVE`/`ACCESS_DENIED` (403), `NOT_FOUND` (404), `RESERVATION_CONFLICT`/`EQUIPMENT_IDENTIFIER_CONFLICT` (409), `VALIDATION_ERROR` (422) y `INTERNAL_ERROR` (500).
